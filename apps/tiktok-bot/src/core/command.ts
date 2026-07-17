export default abstract class Command {
	constructor(public readonly name: string) {}

	abstract run(...args: string[]): Promise<void>;
}
