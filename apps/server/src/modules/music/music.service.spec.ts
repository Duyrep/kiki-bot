import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test, TestingModule } from "@nestjs/testing";
import { MusicService } from "./music.service";

describe("MusicService", () => {
	let service: MusicService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MusicService,
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

		service = module.get<MusicService>(MusicService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
