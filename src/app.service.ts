import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import quoteData from './config/customCombinations.json';
import txnData from './output/quoteOutput.json';
import {
  JsonRpcProvider,
  zeroPadBytes,
  hexlify,
  keccak256,
  AbiCoder,
} from 'ethers';
const abiEncoder = AbiCoder.defaultAbiCoder();
// import { response } from 'express';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}
  getHello(): string {
    return 'Hello World!';
  }
  async getQuote(): Promise<any> {
    try {
      const url = 'https://api-beta.pathfinder.routerprotocol.com/api/v2/quote';
      const params = {
        fromTokenAddress: quoteData[0].sourceToken,
        toTokenAddress: quoteData[0].destinationToken,
        amount: quoteData[0].amount,
        fromTokenChainId: quoteData[0].sourceChain,
        toTokenChainId: quoteData[0].destinationChain,
        partnerId: `1`,
        slippageTolerance: `1`,
        destFuel: `0`,
      };
      const response = await lastValueFrom(
        this.httpService.get(url, { params }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async getTransaction(owner: string): Promise<any> {
    try {
      const url =
        'https://api-beta.pathfinder.routerprotocol.com/api/v2/transaction';
      const data = {
        ...txnData,
        receiverAddress: owner,
        senderAddress: owner,
        metaData: {
          ataAddress: null,
        },
      };
      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await lastValueFrom(
        this.httpService.post(url, data, options),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(error, 500);
    }
  }

  async overrideApproval(
    tokenAddr: string,
    ownerAddr: string,
    spender: string,
    newAllowance: string,
    provider: JsonRpcProvider,
  ) {
    const allowanceSlot = this.getAllowanceSlot(ownerAddr, spender, 1); // Assuming mapping is at slot 1
    const formattedAllowance = zeroPadBytes(hexlify(newAllowance), 32);
    await provider.send('anvil_setStorageAt', [
      tokenAddr,
      allowanceSlot,
      formattedAllowance,
    ]);
    console.info(
      `Approval overridden: ${spender} can now spend ${newAllowance} tokens from ${ownerAddr}`,
    );
  }

  /**
   * Compute the storage slot for the allowance mapping.
   */
  getAllowanceSlot(ownerAddr: string, spender: string, mappingSlot: number) {
    const ownerHash = keccak256(
      abiEncoder.encode(['address', 'uint256'], [ownerAddr, mappingSlot]),
    );
    return keccak256(
      abiEncoder.encode(['address', 'bytes32'], [spender, ownerHash]),
    );
  }

  /**
   * Override the balance for a given account.
   */
  async overrideBalance(
    tokenAddr: string,
    userAddr: string,
    newBalance: string,
    provider: JsonRpcProvider,
  ) {
    const balanceSlot = this.getBalanceSlot(userAddr, 0); // Assuming balance mapping is at slot 0
    const formattedBalance = zeroPadBytes(hexlify(newBalance), 32);
    await provider.send('anvil_setStorageAt', [
      tokenAddr,
      balanceSlot,
      formattedBalance,
    ]);
    console.info(`Balance overridden to ${newBalance}`);
  }

  /**
   * Compute the storage slot for the balance mapping.
   */
  getBalanceSlot(userAddr: string, mappingSlot: number) {
    return keccak256(
      abiEncoder.encode(['address', 'uint256'], [userAddr, mappingSlot]),
    );
  }
}
