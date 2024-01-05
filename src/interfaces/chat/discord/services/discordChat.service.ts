import { Injectable, Logger } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { TextDto } from '../dto/textDto';
import { LangchainService } from '../../../../shared/ai/langchain/chain-builder/langchain.service';

@Injectable()
export class DiscordChatService {
  constructor(
    private readonly chainBuilderService: LangchainService,
    private readonly _logger: Logger,
  ) {}

  @SlashCommand({
    name: 'chat',
    description: 'chat service',
  })
  public async onChat(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    this._logger.log('Received chat request with text: ' + text);
    await interaction.deferReply();
    this._logger.log('Deferred reply');

    const chain =
      await this.chainBuilderService.createChain('gpt-4-1106-preview');

    // @ts-ignore
    const channelDescription = interaction.channel.topic;
    const result = await chain.invoke({
      topic: channelDescription,
      text,
    });

    return interaction.editReply({
      content: result,
    });
  }
}
