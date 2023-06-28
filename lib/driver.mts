import { Client, GatewayIntentBits, Partials, AttachmentBuilder } from 'npm:discord.js';
import { Configuration, OpenAIApi } from "npm:openai";
import https from 'node:https';
import fs from 'node:fs';
import * as mod from "https://deno.land/std@0.192.0/io/buffer.ts";

export default class GPT {
    DiscordToken: string;
    OpenAIToken: string;
    OpenAIURL: string;
    DiscordChannelID: string;
    ChatGPTModel: string;
    DiscordBotID: number;
    BotTokenAmount: number;
    
    constructor ( DiscordToken:string, OpenAIToken:string, OpenAIURL:string, DiscordChannelID:string, ChatGPTModel:string, DiscordBotID:number, BotTokenAmounts:number ) {

        this.DiscordToken = DiscordToken;

        this.OpenAIToken = OpenAIToken;

        this.OpenAIURL = OpenAIURL;

        this.DiscordChannelID = DiscordChannelID;

        this.ChatGPTModel = ChatGPTModel;

        this.DiscordBotID = DiscordBotID;

        this.BotTokenAmount = BotTokenAmounts;
    }

    #getFile( url:string ):Promise<string> {
        return new Promise( ( resolve, reject ) => {
            https.get( url, ( response: any ) => {
                let data = '';
                response.on( 'data', ( chunk: string ) => data += chunk );
                response.on( 'end', () => resolve( data ) );
            } ).on( 'error', ( error: any ) => reject( error ) );
        } );
    }

    async #getChatGPTAnswer( model: string, max_tokens: number, history: any[] ) {
            const configuration = new Configuration( { apiKey: this.OpenAIToken, basePath: this.OpenAIURL } );
            const openai = new OpenAIApi( configuration );
            const resp = await openai.createChatCompletion( {
                model: model, temperature: 0.6, max_tokens: max_tokens, messages: [
                    {
                        role: 'system',
                        content: ""
                    },
                    ...history
                ]
            } );
             return resp;
    }

    async run() {

        const client = new Client( {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.DirectMessageReactions
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.User,
                Partials.GuildMember,
                Partials.Reaction,
                Partials.ThreadMember
            ]
        } );

        client.on( 'ready', () => {
            console.log( `Logged in as ${ client.user!.tag }` );
        } );

        let MessageHistory = JSON.parse( fs.readFileSync( './json/history.json' ).toString() );

        client.on( "messageCreate", async ( message ) => {
            if ( message.content == "!очистить историю" ) {
                MessageHistory = [];
                fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, `\n`, 4 ) );
                message.reply( "История очищена!" );
                return;
            }
            const attachmentURL: string = message.attachments.toJSON()[ 0 ]?.url;
            const attachment: string | undefined = attachmentURL ? await this.#getFile( attachmentURL ) : undefined; // проблема с получением фаила решена довольно просто
            if ( attachment ) message.content += "```\n" + attachment + "\n"; // при наличии вложения добавлять его содержимое в конец запроса. Проверки на тип нет, по этому все другие вложения он пытается добавить как бинарную информацию, позже починю
            if ( message.channel.id != this.DiscordChannelID ) return;
            const role: string = ( message.author.id == client.user!.id ) ? 'assistant' : 'user';
            MessageHistory.push( { role: role, content: message.content, name: message.author.username.replace( /\s+/g, '_' ).replace( /[^\w\s]/gi, '' ) } );
            if ( MessageHistory.length > 10 ) MessageHistory.shift();
            fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, "\n", 4 ) );
            if ( message.author.id == client.user!.id ) return;
            await message.channel.sendTyping();

            const response: string = String((await this.#getChatGPTAnswer( this.ChatGPTModel, this.BotTokenAmount, MessageHistory )).data.choices[0].message?.content)

            if ( response.length < 2000 ) message.reply( response );
            else {

                const attachment = new AttachmentBuilder( response, { name: 'message.txt' } );
                message.reply( { files: [ attachment ] } );
            }
        } );

        client.login( this.DiscordToken );
    }
}
