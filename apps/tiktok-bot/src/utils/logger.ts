import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

const pinoOptions: pino.LoggerOptions = {
	level: process.env.LOG_LEVEL || "trace",
};

if (isDevelopment) {
	pinoOptions.transport = {
		target: "pino-pretty",
		options: {
			colorize: true,
			colorizeObjects: true,
			levelFirst: true,
			translateTime: "mm/dd/yyyy, h:MM:ss TT",
			ignore: "pid,hostname,time,context",
			messageFormat:
				"\x1b[32m[BOT]\x1b[0m {pid}  - {time}     {level} \x1b[33m[{context}]\x1b[0m {msg}",
			customColors:
				"trace:magenta,debug:blue,info:green,warn:yellow,error:red,fatal:bgRed,white",
		},
	};
}

const logger = pino(pinoOptions);

export default logger;
