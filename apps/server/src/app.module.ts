import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MusicModule } from "./modules/music/music.module";
import { AppGatewayModule } from "./socket/app.gateway.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [".env.development.local"],
			ignoreEnvFile: process.env.NODE_ENV === "production",
		}),
		EventEmitterModule.forRoot({
			wildcard: true,
			verboseMemoryLeak: true,
		}),
		AppGatewayModule,
		ScheduleModule.forRoot(),
		MusicModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
