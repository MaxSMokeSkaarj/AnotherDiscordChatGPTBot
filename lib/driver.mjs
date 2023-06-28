import { Client, GatewayIntentBits, Partials, AttachmentBuilder } from 'discord.js';
import { Configuration, OpenAIApi } from "openai";
import https from 'https';
import fs from 'fs';

/**
 * Основной класс
*/
export default class GPT {

    /**
     * Конструктор класса, Принимает основные параметры
     * @param {String} DiscordToken Токен бота Discord
     * @param {String} OpenAIToken Токен сервера - провайдера AI
     * @param {String} OpenAIURL URL сервера - провайдера AI
     * @param {Number} DiscordChannelID  ID канала Discord, в котором будет работать бот
     * @param {String} ChatGPTModel  Модель поведения бота
     * @param {Number} DiscordBotID ID бота в Discord
     * @param {Number} BotTokenAmounts  Количество токенов для сервиса - провайдера AI
    */
    constructor ( DiscordToken, OpenAIToken, OpenAIURL, DiscordChannelID, ChatGPTModel, DiscordBotID, BotTokenAmounts ) {

        /**
         * Токен бота Discord
         * @type {String}
        */
        this.DiscordToken = DiscordToken;

        /**
         * Токен сервера - провайдера AI
         * @type {String}
        */
        this.OpenAIToken = OpenAIToken;

        /**
         * URL сервера - провайдера AI
         * @type {String}
        */
        this.OpenAIURL = OpenAIURL;

        /**
         * ID канала Discord, в котором будет работать бот
         * @type {Number}
        */
        this.DiscordChannelID = DiscordChannelID;

        /**
         * Модель поведения бота
         * @type {String}
        */
        this.ChatGPTModel = ChatGPTModel;

        /**
         * ID бота в Discord
         * @type {Number}
        */
        this.DiscordBotID = DiscordBotID;

        /**
         * Количество токенов для сервиса - провайдера AI
         * @type {Number}
        */
        this.BotTokenAmount = BotTokenAmounts;
    }

    /**
     * Скачивание вложений Discord
     * @param {String} url URL фаила, полученный у Discord
     * @returns {Promise<String>}
     */
    #getFile( url ) {
        return new Promise( ( resolve, reject ) => {
            https.get( url, ( response ) => {
                let data = '';
                response.on( 'data', ( chunk ) => data += chunk );
                response.on( 'end', () => resolve( data ) );
            } ).on( 'error', ( error ) => reject( error ) );
        } );
    }

    /**
     * Получение ответа на промпт
     * @param {String} model Модель поведения бота
     * @param {Number} max_tokens Количество токенов для сервиса - провайдера AI
     * @param {Array<Object>} history История переписки
     * @returns {Promise<String>}
    */
    async #getChatGPTAnswer( model, max_tokens, history ) {
            const configuration = new Configuration( { apiKey: this.OpenAIToken, basePath: this.OpenAIURL } );
            const openai = new OpenAIApi( configuration );
            let resp = await openai.createChatCompletion( {
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

    /**
     * Обработчик
    */
    async run() {

        /** Экземпляр клиента Discord    */
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

        // Готовность
        client.on( 'ready', () => {
            console.log( `Logged in as ${ client.user.tag }` );
        } );

        /**
        * История сообщений
        * @type {Array}
        */
        let MessageHistory = JSON.parse( fs.readFileSync( './json/history.json' ).toString() );

        // Подключаемся к событию "message" Discord клиента
        client.on( "messageCreate", async ( message ) => {

            if ( message.content == "!очистить историю" ) // проверка на команду очистки памяти
            {
                MessageHistory = [];
                fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, '\n', 4 ) );
                message.reply( "История очищена!" );
                return;
            }

            let attachmentURL = message.attachments.toJSON()[ 0 ]?.url;
            let attachment = attachmentURL ? await this.#getFile( attachmentURL ) : undefined; // проблема с получением фаила решена довольно просто
            if ( attachment ) message.content += "```\n" + attachment + "\n"; // при наличии вложения добавлять его содержимое в конец запроса. Проверки на тип нет, по этому все другие вложения он пытается добавить как бинарную информацию, позже починю
            if ( message.channel.id != this.DiscordChannelID ) return; // Обработка канала дс

            let role = ( message.author.id == client.user.id ) ? 'assistant' : 'user';
            MessageHistory.push( { role: role, content: message.content, name: message.author.username.replace( /\s+/g, '_' ).replace( /[^\w\s]/gi, '' ) } );
            if ( MessageHistory.length > 10 ) MessageHistory.shift();
            fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, '\n', 4 ) );
            if ( message.author.id == client.user.id ) return;  // Фильтр на ответ самому себе

            await message.channel.sendTyping();

            // Генерируем ответ с использованием ChatGPT
            let response = await this.#getChatGPTAnswer( this.ChatGPTModel, this.BotTokenAmount, MessageHistory ).catch( ( e ) => {
                message.reply( e );
                return;
            } );
            response = response.data.choices[ 0 ].message.content;

            // Отправляем ответ в Discord канал
            if ( response.length < 2000 ) message.reply( response );
            else {

                //let attachment = new MessageAttachment( Buffer.from( response ), 'message.txt' );
                let attachment = new AttachmentBuilder( Buffer.from( response ), { name: 'message.txt' } );
                message.reply( { files: [ attachment ] } );
            }

        } );

        // Запускаем Discord бота
        client.login( this.DiscordToken );
    }
}
