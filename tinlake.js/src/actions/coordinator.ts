import BN from 'bn.js'
import { calculateOptimalSolution, Orders, SolverResult, SolverWeights, State } from '../services/solver/solver'
import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

const e27 = new BN(10).pow(new BN(27))

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    /**
     * @param beforeClosing if true, calculate the values as if the epoch would be closed now
     */
    getEpochState = async (beforeClosing?: boolean) => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')
      const feed = this.contract('FEED')
      const isMakerIntegrated = this.contractAddresses['CLERK'] !== undefined

      const reserve = await this.toBN(
        beforeClosing
          ? isMakerIntegrated
            ? this.contract('ASSESSOR').totalBalance()
            : this.contract('RESERVE').totalBalance()
          : coordinator.epochReserve()
      )
      const netAssetValue = await this.toBN(
        beforeClosing
          ? this.contractVersions['FEED'] === 2
            ? feed.latestNAV()
            : feed.approximatedNAV()
          : coordinator.epochNAV()
      )
      const seniorAsset = beforeClosing
        ? isMakerIntegrated
          ? (await this.toBN(assessor.seniorDebt())).add(await this.toBN(assessor.seniorBalance()))
          : (await this.toBN(assessor.seniorDebt_())).add(await this.toBN(assessor.seniorBalance_()))
        : await this.toBN(coordinator.epochSeniorAsset())

      const minDropRatio = await this.toBN(assessor.minSeniorRatio())
      const maxDropRatio = await this.toBN(assessor.maxSeniorRatio())
      const maxReserve = await this.toBN(assessor.maxReserve())

      return { reserve, netAssetValue, seniorAsset, minDropRatio, maxDropRatio, maxReserve }
    }

    /**
     * @param beforeClosing if true, calculate the values as if the epoch would be closed now
     */
    getOrders = async (beforeClosing?: boolean) => {
      if (beforeClosing) {
        const seniorTranche = this.contract('SENIOR_TRANCHE')
        const juniorTranche = this.contract('JUNIOR_TRANCHE')
        const assessor = this.contract('ASSESSOR')
        const feed = this.contract('FEED')

        const epochNAV = await this.toBN(feed.currentNAV())
        const epochReserve = await this.toBN(this.contract('RESERVE').totalBalance())
        const epochSeniorTokenPrice = await this.toBN(
          assessor['calcSeniorTokenPrice(uint256,uint256)'](epochNAV.toString(), epochReserve.toString())
        )
        const epochJuniorTokenPrice = await this.toBN(
          assessor['calcJuniorTokenPrice(uint256,uint256)'](epochNAV.toString(), epochReserve.toString())
        )

        return {
          dropInvest: await this.toBN(seniorTranche.totalSupply()),
          dropRedeem: (await this.toBN(seniorTranche.totalRedeem())).mul(epochSeniorTokenPrice).div(e27),
          tinInvest: await this.toBN(juniorTranche.totalSupply()),
          tinRedeem: (await this.toBN(juniorTranche.totalRedeem())).mul(epochJuniorTokenPrice).div(e27),
        }
      }
      const coordinator = this.contract('COORDINATOR')
      const orderState = await coordinator.order()

      return {
        dropInvest: await this.toBN(orderState.seniorSupply),
        dropRedeem: await this.toBN(orderState.seniorRedeem),
        tinInvest: await this.toBN(orderState.juniorSupply),
        tinRedeem: await this.toBN(orderState.juniorRedeem),
      }
    }

    getSolverWeights = async () => {
      const coordinator = this.contract('COORDINATOR')

      return {
        dropInvest: await this.toBN(coordinator.weightSeniorSupply()),
        dropRedeem: await this.toBN(coordinator.weightSeniorRedeem()),
        tinInvest: await this.toBN(coordinator.weightJuniorSupply()),
        tinRedeem: await this.toBN(coordinator.weightJuniorRedeem()),
      }
    }

    closeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      return this.pending(coordinator.closeEpoch({ ...this.overrides, gasLimit: 5000000 }))
    }

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if ((await coordinator.submissionPeriod()) === false) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch({ ...this.overrides, gasLimit: 5000000 })
        const closeResult = await this.getTransactionReceipt(closeTx)

        if (closeResult.status === 0) {
          console.log('Failed to close the epoch')
          return { status: 0, error: 'Unable to close the epoch', hash: closeResult.transactionHash } as any
        }

        // If it's not in a submission period after closing the epoch, then it could immediately be solved and executed
        // (i.e. all orders could be fulfilled)
        if ((await coordinator.submissionPeriod()) === false) {
          console.log('Epoch was immediately executed')
          return { status: 1, hash: closeResult.transactionHash } as any
        }
      }
      const state = await this.getEpochState()
      const orders = await this.getOrders()

      const solution = await this.runSolver(state, orders)

      if (!solution.isFeasible) {
        throw new Error('Failed to find a solution')
      }

      const submissionTx = coordinator.submitSolution(
        solution.dropRedeem.toString(),
        solution.tinRedeem.toString(),
        solution.tinInvest.toString(),
        solution.dropInvest.toString(),
        this.overrides
      )

      return this.pending(submissionTx)
    }

    runSolver = async (state: State, orders: Orders, calcInvestmentCapacity?: boolean) => {
      const weights = await this.getSolverWeights()
      const solution = await calculateOptimalSolution(state, orders, weights, calcInvestmentCapacity)

      if (!solution.isFeasible) {
        throw new Error('Failed to find a solution')
      }

      return solution
    }

    scoreSolution = async (solution: SolverResult) => {
      const weights = await this.getSolverWeights()
      return solution.dropInvest
        .mul(weights.dropInvest)
        .add(solution.dropRedeem.mul(weights.dropRedeem))
        .add(solution.tinInvest.mul(weights.tinInvest))
        .add(solution.tinRedeem.mul(weights.tinRedeem))
    }

    bestSubmissionScore = async () => {
      const coordinator = this.contract('COORDINATOR')
      return await this.toBN(coordinator.bestSubScore())
    }

    executeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      if ((await this.getCurrentEpochState()) !== 'challenge-period-ended') {
        throw new Error('Current epoch is still in the challenge period')
      }

      return this.pending(coordinator.executeEpoch({ ...this.overrides, gasLimit: 2000000 }))
    }

    getCurrentEpochId = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.currentEpoch())).toNumber()
    }

    getLatestBlockTimestamp = async () => {
      const latestBlock = await this.provider.getBlock(await this.provider.getBlockNumber())
      if (!latestBlock) return new Date().getTime()
      return latestBlock.timestamp
    }

    getLastEpochClosed = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.lastEpochClosed())).toNumber()
    }

    getMinimumEpochTime = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.minimumEpochTime())).toNumber()
    }

    getMinChallengePeriodEnd = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.minChallengePeriodEnd())).toNumber()
    }

    getSubmissionPeriod = async () => {
      return await this.contract('COORDINATOR').submissionPeriod()
    }

    getChallengeTime = async () => {
      return (await this.toBN(this.contract('COORDINATOR').challengeTime())).toNumber()
    }

    getCurrentEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')

      const minChallengePeriodEnd = (await this.toBN(coordinator.minChallengePeriodEnd())).toNumber()
      const latestBlockTimestamp = await this.getLatestBlockTimestamp()
      if (minChallengePeriodEnd !== 0) {
        if (minChallengePeriodEnd < latestBlockTimestamp) return 'challenge-period-ended'
        return 'in-challenge-period'
      }

      const submissionPeriod = await coordinator.submissionPeriod()
      if (submissionPeriod === true) {
        return 'in-submission-period'
      }

      const lastEpochClosed = (await this.toBN(coordinator.lastEpochClosed())).toNumber()
      const minimumEpochTime = (await this.toBN(coordinator.minimumEpochTime())).toNumber()
      if (submissionPeriod === false) {
        if (lastEpochClosed + minimumEpochTime < latestBlockTimestamp) return 'can-be-closed'
        return 'open'
      }

      throw new Error('Arrived at impossible current epoch state')
    }
  }
}

export type EpochState =
  | 'open'
  | 'can-be-closed'
  | 'in-submission-period'
  | 'in-challenge-period'
  | 'challenge-period-ended'

export type ICoordinatorActions = {
  getEpochState(beforeClosing?: boolean): Promise<State>
  getOrders(beforeClosing?: boolean): Promise<Orders>
  getSolverWeights(): Promise<SolverWeights>
  solveEpoch(): Promise<PendingTransaction>
  closeEpoch(): Promise<PendingTransaction>
  executeEpoch(): Promise<PendingTransaction>
  getCurrentEpochId(): Promise<number>
  getLatestBlockTimestamp(): Promise<number>
  getLastEpochClosed(): Promise<number>
  getMinimumEpochTime(): Promise<number>
  getMinChallengePeriodEnd(): Promise<number>
  getSubmissionPeriod(): Promise<boolean>
  getChallengeTime(): Promise<number>
  getCurrentEpochState(): Promise<EpochState>
  runSolver(state: State, orders: Orders): Promise<SolverResult>
  scoreSolution(solution: SolverResult): Promise<BN>
  bestSubmissionScore(): Promise<BN>
}

export default CoordinatorActions
