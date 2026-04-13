#!/usr/bin/env node
import process from 'node:process';
import meow from 'meow';
import {deleteAsync} from 'del';
import {isPresentableError} from 'presentable-error';

const logEvent = event => {
	if (event.path !== undefined) {
		console.log(event.path);
	}
};

const noop = () => {};

const cli = meow(`
	Usage
	  $ del <path|glob> …

	Options
	  --force, -f    Allow deleting the current working directory and outside
	  --dry-run, -d  List what would be deleted instead of deleting (silent if no matches)
	  --verbose, -v  Display the absolute path of files and directories as they are deleted

	Examples
	  $ del unicorn.png rainbow.png
	  $ del "*.png" "!unicorn.png"
`, {
	importMeta: import.meta,
	flags: {
		force: {
			type: 'boolean',
			shortFlag: 'f',
		},
		dryRun: {
			type: 'boolean',
			shortFlag: 'd',
		},
		verbose: {
			type: 'boolean',
			shortFlag: 'v',
		},
	},
});

if (cli.input.length === 0) {
	console.error('Specify at least one path');
	process.exitCode = 1;
} else {
	try {
		const {verbose, dryRun, ...flags} = cli.flags;

		// Only use onProgress for verbose mode when not in dry-run
		// In dry-run mode, we print the files at the end instead
		const onProgress = verbose && !dryRun ? logEvent : noop;

		const files = await deleteAsync(cli.input, {onProgress, dryRun, ...flags});

		if (dryRun && files.length > 0) {
			console.log(files.join('\n'));
		}
	} catch (error) {
		if (isPresentableError(error)) {
			console.error(error.message);
		} else {
			throw error;
		}

		process.exitCode = 1;
	}
}
