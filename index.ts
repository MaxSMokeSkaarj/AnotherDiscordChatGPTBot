import "https://deno.land/std@0.192.0/dotenv/load.ts";
import GPT from './lib/driver.ts';

/** 
 * Токен бота Discord
 * @type {String}
*/
const DiscordToken: string = String(Deno.env.get("DiscordToken"))

/** 
 * Токен OpenAI
 * @type {String}
*/
const OpenAIToken: string = String( Deno.env.get( "OpenAIToken" ))

/**
 * URL OpenAI
 * @type {String}
*/
const OpenAIURL: string = String(Deno.env.get("OpenAIURL"))

/**
 * Discord channel ID
 * @type {String}
*/
const DiscordChannelID: string = String(Deno.env.get( "DiscordChannelID" ))

/**
 * Модель поведения бота
 * @type {String}
*/
const ChatGPTModel: string = String(Deno.env.get( "ChatGPTModel" ));

/**
 * ID чата Discord
 * @type {Number}
*/
const DiscordBotID: number= Number( Deno.env.get( "DiscordBotID" ) );

/** 
 * Количество Токенов ChatGPT
 * @type {Number}
*/
const BotTokenAmount: number = Number( Deno.env.get( "BotTokenAmount" ) );

const ChatGPT = new GPT( DiscordToken, OpenAIToken, OpenAIURL, DiscordChannelID, ChatGPTModel, DiscordBotID, BotTokenAmount );
ChatGPT.run();
ChatGPT;
