import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test, TestingModule } from "@nestjs/testing";
import { YoutubeMusicService } from "./music.youtube.service";

describe("YoutubeMusicService", () => {
	let service: YoutubeMusicService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				YoutubeMusicService,
				{
					provide: EventEmitter2,
					useValue: {
						emit: jest.fn(),
					},
				},
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn().mockReturnValue("http://localhost:3000"),
					},
				},
			],
		}).compile();

		service = module.get<YoutubeMusicService>(YoutubeMusicService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
