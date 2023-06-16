require( 'dotenv' ).config();
const { Client, Events, GatewayIntentBits, discordSort } = require( 'discord.js' );
const { Configuration, OpenAIApi } = require( "openai" );
const fs = require( 'fs' );

/** 
 * Токен бота Discord
 * @type {String}
*/
let DiscordToken = process.env.DiscordToken;

/** 
 * Токен OpenAI
 * @type {String}
*/
let OpenAIToken = process.env.OpenAIToken;

/** URL OpenAI
 * @type {String}
*/
let OpenAIURL = process.env.OpenAIURL;

/** Discord channel ID
 * @type {String}
*/
let DiscordChannelID = process.env.DiscordChannelID;

/** Модель поведения бота
 * @type {String}
*/
let ChatGPTModel = process.env.ChatGPTModel;

/** ID чата Discord
 * @type {String}
*/
let DiscordBotID = process.env.DiscordBotID;

/** 
 * Количество Токенов ChatGPT
 * @type {Number}
*/
let BotTokenAmount = Number( process.env.BotTokenAmount );

// Создаем экземпляр клиента Discord
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
    ]
} );

// Конфигурируем экземпляр OpenAI API
/** Конфиграция OpenAI */
const configuration = new Configuration( {
    apiKey: OpenAIToken,
    basePath: OpenAIURL,
} );

// Инициализируем экземпляр OpenAI API
/** Экземпляр OpenAI */
const openai = new OpenAIApi( configuration );

// Подключаемся к событию "ready" Discord клиента
client.on( 'ready', () =>
{
    console.log( `Logged in as ${ client.user.tag }` );
} );

// Подключаемся к событию "message" Discord клиента 
client.on( 'messageCreate', async ( message ) =>
{

    /**
    * История сообщений
    * @type {Array}
    */
    //let MessageHistory = [];
         let MessageHistory = JSON.parse( fs.readFileSync( './json/history.json' ).toString() );
    if ( message.channel.id != DiscordChannelID ) return;
    await message.channel.sendTyping();
    if ( message.author.id == client.user.id )
    {
        MessageHistory.unshift( {
            role: 'assistant',
            message: [ ...MessageHistory ],
            name: message.author.username.replace( /\s+/g, '_' ).replace( /[^\w\s]/gi, '' ),
        } );
        if ( MessageHistory.length > 10 ) MessageHistory.pop();
        fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, '\n', 4 ) );
    } else
    {
        MessageHistory.unshift( {
            role: 'user',
            message: message.content,
            name: message.author.username.replace( /\s+/g, '_' ).replace( /[^\w\s]/gi, '' ),
        } );
        if ( MessageHistory.length > 10 ) MessageHistory.pop();
        fs.writeFileSync( './json/history.json', JSON.stringify( MessageHistory, '\n', 4 ) );
    }

    console.log( typeof ( BotTokenAmount ) );
    if ( message.author.id == client.user.id ) return;
    // Генерируем ответ с использованием ChatGPT
    let response = await openai.createChatCompletion( {
        model: ChatGPTModel,
        temperature: 0.6,
        max_tokens: BotTokenAmount,
        messages: [ ...MessageHistory ]
    } );

    // Отправляем ответ в Discord канал
    message.reply( response.data.choices[ 0 ].message.content );
} );


// Запускаем Discord бота
client.login( DiscordToken );
