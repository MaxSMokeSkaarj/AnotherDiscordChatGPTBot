import { configDotenv } from 'dotenv';
configDotenv();
import GPT from './lib/driver.mjs';

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
 * @type {String}
*/
let DiscordChannelID = process.env.DiscordChannelID;

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
ChatGPT;
