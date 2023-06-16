require( 'dotenv' ).config();
const { Client, Events, GatewayIntentBits } = require( 'discord.js' );
const { Configuration, OpenAIApi } = require( "openai" );

/** 
 * Токен бота Discord
 * @type {string}
*/
let DiscordToken = process.env.DiscordToken;

/** 
 * Токен OpenAI
 * @type {string}
*/
let OpenAIToken = process.env.OpenAIToken;

/** URL OpenAI
 * @type {string}
*/
let OpenAIURL = process.env.OpenAIURL;

/** Discord channel ID
 * @type {string}
*/
let DiscordChannelID = process.env.DiscordChannelID;

/** Модель поведения бота
 * @type {string}
*/
let ChatGPTModel = process.env.ChatGPTModel;

/** ID чата Discord
 * @type {string}
*/
let DiscordBotID = process.env.DiscordBotID;

/** 
 * Количество Токенов ChatGPT
 * @type {string}
*/
let BotTokenAmount = process.env.BotTokenAmount;

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

// Создаём историю сообщений
/**
 * История сообщений
 * @type {Object[]}
*/
let MessageHistory = [];

// Подключаемся к событию "message" Discord клиента 
client.on( 'messageCreate', async ( message ) =>
{

    // Проверяем, что сообщение отправлено в определенный канал и на то, что бот не отвечает на свои ответы
    if ( message.channel.id === DiscordChannelID && message.author.id != DiscordBotID )
    {
        // Посылаем Discord'у что бот начинает писать
        message.channel.sendTyping();

        // проверяем на команду очистки памяти
        if ( message.content == "!Очистить историю" )
        {
            MessageHistory = []; // Приметивная очистка
            message.reply( "--- Очистка истории выполнена! ---" );
            return; // Прерываем чтобы ничего не поломать.
        }
        // Вставляем сообщение пользователя в начало
        MessageHistory.unshift( { content: message.content, role: 'user' } );
        if ( MessageHistory.length > 10 )
        {
            MessageHistory.pop(); // Если превысили максимум, убираем с конца.
        }

        // Генерируем ответ с использованием ChatGPT
        let response = await openai.createChatCompletion( {
            model: ChatGPTModel,
            temperature: 0.6,
            max_tokens: 7000,
            messages: [
                {
                    role: 'system',
                    content: ''
                },
                ...MessageHistory
            ]
        } );

        // Отправляем ответ в Discord канал
        message.reply( response.data.choices[ 0 ].message.content );

        // Вставляем сообщение бота в начало.
        MessageHistory.unshift( { content: response.data.choices[ 0 ].message.content, role: 'system' } );
        if ( MessageHistory.length > 10 )
        {
            MessageHistory.pop(); // Если превысили максимум, убираем с конца.
        }
    }
} );


// Запускаем Discord бота
client.login( DiscordToken );
