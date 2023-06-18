require( 'dotenv' ).config();
const { GPT } = require( './lib/driver' );

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
/**
 * URL OpenAI
 * @type {String}
*/
let OpenAIURL = process.env.OpenAIURL;
/**
 * Discord channel ID
 * @type {Number}
*/
let DiscordChannelID = Number( process.env.DiscordChannelID );
/**
 * Модель поведения бота
 * @type {String}
*/
let ChatGPTModel = process.env.ChatGPTModel;
/**
 * ID чата Discord
 * @type {Number}
*/
let DiscordBotID = Number( process.env.DiscordBotID );
/** 
 * Количество Токенов ChatGPT
 * @type {Number}
*/
let BotTokenAmount = Number( process.env.BotTokenAmount );

let ChatGPT = new GPT( DiscordToken, OpenAIToken, OpenAIURL, DiscordChannelID, ChatGPTModel, DiscordBotID, BotTokenAmount );
ChatGPT.run();
