import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { FileOutputService } from './file-output/file-output.service';
import { startAnvil } from '@brinkninja/node-anvil';
// const { startAnvil } = pkg;
import { JsonRpcProvider } from 'ethers';
import txnData from './output/transactionOutput.json';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly fileOutputService: FileOutputService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('transaction')
  async getTransaction(): Promise<any> {
    const quoteOutput = await this.appService.getQuote();
    await this.fileOutputService.saveJsonOutput(
      'quoteOutput.json',
      quoteOutput,
    );

    //take ChainId from transactionOutput and pass it to anvil
    //fetch list of rpcs from the source chainId
    //initiate anvil with the rpcs

    let anvilInstance;
    try {
      anvilInstance = await startAnvil({
        port: 8545,
        forkUrl: 'https://polygon-bor.publicnode.com',
        chainId: 137,
        host: '127.0.0.1',
      });
      console.log(`Anvil started on port ${anvilInstance.port}`);

      const provider = new JsonRpcProvider(`http://localhost:8545`);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const accounts = await provider.listAccounts();
      console.log('List of accounts:', accounts);

      const owner = accounts[0].address;

      const transactionOutput = await this.appService.getTransaction(owner);
      await this.fileOutputService.saveJsonOutput(
        'transactionOutput.json',
        transactionOutput,
      );

      //overrride the approval
      await this.appService.overrideApproval(
        txnData.fromTokenAddress,
        txnData.txn.from,
        txnData.allowanceTo,
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        provider,
      );
      //override the balance check
      await this.appService.overrideBalance(
        txnData.fromTokenAddress,
        txnData.txn.from,
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        provider,
      );

      const tx = txnData.txn;

      // console.log('Transaction to simulate:', tx);

      const result = await provider.call(tx);
      console.log('Simulation successful. Result:', result);

      //reset the approval
      await this.appService.overrideApproval(
        txnData.fromTokenAddress,
        txnData.txn.from,
        txnData.allowanceTo,
        '0x00',
        provider,
      );
      //reset the balance check
      await this.appService.overrideBalance(
        txnData.fromTokenAddress,
        txnData.txn.from,
        '0x00',
        provider,
      );
    } catch (error) {
      console.error('Error during simulation:', error);
    } finally {
      // Ensure Anvil is stopped after the simulation.
      if (anvilInstance) {
        try {
          anvilInstance.kill();
          console.log('Anvil process stopped.');
        } catch (killError) {
          console.error('Error stopping Anvil:', killError);
        }
      }
    }
    return new Promise((resolve) => {
      resolve('Transaction completed');
    });
  }
}
