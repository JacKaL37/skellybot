import { OpenAI } from 'langchain/llms/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { OpenaiSecretsService } from '../openai/openai-secrets.service';
import { ChatPromptTemplate, MessagesPlaceholder } from 'langchain/prompts';
import { BufferMemory } from 'langchain/memory';
import { RunnableSequence } from 'langchain/runnables';

@Injectable()
export class LangchainService {
  private _model: OpenAI<any>;

  constructor(
    @Inject(getConnectionToken()) private connection: Connection,
    private readonly _openAiSecrets: OpenaiSecretsService,
    private readonly _logger: Logger,
  ) {}
  private async _createModel(modelName?: string) {
    if (!this._model) {
      this._logger.log('Creating model...');
      this._model = new OpenAI({
        modelName: modelName || 'gpt-4-1106-preview',
        openAIApiKey: await this._openAiSecrets.getOpenAIKey(),
      });
    }
    this._logger.log('Returning model: ' + this._model.modelName);
    return this._model;
  }

  public async createBufferMemoryChain(modelName?: string) {
    const model = await this._createModel(modelName);
    const prompt = ChatPromptTemplate.fromMessages([
      // TODO: Feed in a context prompt key
      ['system', 'You are a helpful chatbot'],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    const memory = new BufferMemory({
      returnMessages: true,
      inputKey: 'input',
      outputKey: 'output',
      memoryKey: 'history',
    });

    const chain = RunnableSequence.from([
      {
        input: (initialInput) => initialInput.input,
        memory: () => memory.loadMemoryVariables({}),
      },
      {
        input: (previousOutput) => previousOutput.input,
        history: (previousOutput) => previousOutput.memory.history,
      },
      prompt,
      model,
    ]);

    // await this.demo(chain, memory);

    return { chain, memory };
  }

  public async demo(chain: RunnableSequence, memory?: BufferMemory) {
    if (memory) {
      console.log(
        `Current Memory - await memory.loadMemoryVariables({}): ${JSON.stringify(
          await memory.loadMemoryVariables({}),
        )}`,
      );
    }

    const inputs = {
      input: 'Hey, Botto! Reply with an unexpected emoji',
    };

    console.log(`HumanInput:\n\n ${inputs.input}`);

    const response = await chain.invoke(inputs);

    console.log(`AI Response:\n\n ${response}`);

    await memory.saveContext(inputs, {
      output: response,
    });

    const inputs2 = {
      input: 'What emoji did you just say?',
    };

    console.log(`HumanInput:\n\n ${inputs2.input}`);

    const response2 = await chain.invoke(inputs2);

    console.log(`AI Response:\n\n ${response2}`);

    await memory.saveContext(inputs2, {
      output: response2,
    });

    if (memory) {
      console.log(
        `Current Memory - await memory.loadMemoryVariables({}): ${JSON.stringify(
          await memory.loadMemoryVariables({}),
        )}`,
      );
    }
    memory.clear();
  }
}