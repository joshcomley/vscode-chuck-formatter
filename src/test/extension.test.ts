import * as assert from 'assert';
import { ChucKFormatter } from '../chuck-formatter';

suite('ChucK Formatter Tests', () => {
	test('Should format simple code', () => {
		const input = `0 => int x;`;
		const expected = `0 => int x;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Simple code formatting failed');
	});

	test('Should preserve single newlines', () => {
		const input = `0 => int x;\n1 => int y;`;
		const expected = `0 => int x;\n1 => int y;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Single newline preservation failed');
	});

	test('Should preserve double newlines', () => {
		const input = `0 => int x;\n\n1 => int y;`;
		const expected = `0 => int x;\n\n1 => int y;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Double newline preservation failed');
	});

	test('Should preserve more than two newlines', () => {
		const input = `0 => int x;\n\n\n\n\n\n1 => int y;`;
		const expected = `0 => int x;\n\n\n\n\n\n1 => int y;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Too many newlines added');
	});

	test('Should handle comments correctly', () => {
		const input = `// This is a comment\n0 => int x;`;
		const expected = `// This is a comment\n0 => int x;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Comment handling failed');
	});

	test('Should handle member access correctly', () => {
		const input = `0.5 => osc.gain;`;
		const expected = `0.5 => osc.gain;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Member access handling failed');
	});

	test('Should handle arithematic correctly', () => {
		const input = `1+(2   + 3  / 44 )  ;`;
		const expected = `1 + (2 + 3 / 44);`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Arithmetic handling failed');
	});

	test('Should handle type declarations correctly', () => {
		const input = `0 => int x;`;
		const expected = `0 => int x;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'Type declaration handling failed');
	});

	test('Should format signed values in brackets correctly', () => {
		const input = `playChord( -4, major);`;
		const expected = `playChord(-4, major);`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Should format assign plus correctly', () => {
		const input = `0.1 	+=>    j ; `;
		const expected = `0.1 +=> j;`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Should format for loops correctly', () => {
		const input = `for ( 0 => int i; i < 10; i++ ) { }`;
		const expected = `for (0 => int i; i < 10; i++)
{
    
}`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'For loop formatting failed');
	});

	test('Should format for loops with newlines correctly', () => {
		const input = `for (
0 => int i;
i < 10;
i++
) {
}
`;
		const expected = `for (
0 => int i;
i < 10;
i++
)
{
    
}`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Should format for loops with compound statements correctly', () => {
		const input = `for ( 0 => int i; i < 10; i++ ) {
<<< "i is " <<< i;
}
`;
		const expected = `for (0 => int i; i < 10; i++)
{
    <<< "i is " <<< i;
}`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected, 'For loop with compound statements failed');
	});

	test('Invocations after a close parentheses should not have a space', () => {
		const input = `something()  .andMe();`;
		const expected = `something().andMe();`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Comments at the end of a line should be preserved as is and with a single space preceding it', () => {
		const input = `something()  .andMe();// Hello ()`;
		const expected = `something().andMe(); // Hello ()`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Comments in the middle of a line should be preserved as is', () => {
		const input = `something() /* Hello! */  .andMe();// Hello ()`;
		const expected = `something() /* Hello! */ .andMe(); // Hello ()`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Numbers preceded by a plus should not introduce a space', () => {
		const input = `1   +   +1`;
		const expected = `1 + +1`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Numbers preceded by a minus should not introduce a space', () => {
		const input = `1   +   -1`;
		const expected = `1 + -1`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});

	test('Bulk test', () => {
		const input = `TriOsc osc =>dac;

0.5 => osc.  gain;

[0, 4,   7]@=> int major[   ];
[ 0, 3, 7 ] @=> int minor[];

48 => int offset;
int position;

70 ::ms => dur eighth;



48+ ( 30   / 2);

<<< "Hello()/2!" >>>;

// while(true)++,[1,2]
{
    0 => position;
    for ( 0 => int i; i < 4; i  ++ )
        {
        i => position;
        for (0 => int j; j < 3; j ++){
            Std.mtof(major[j] +    offset + position) => osc.freq;
            eighth =>    now;
        }
    }
}`;
		const expected = `TriOsc osc => dac;

0.5 => osc.gain;

[ 0, 4, 7 ] @=> int major[];
[ 0, 3, 7 ] @=> int minor[];

48 => int offset;
int position;

70::ms => dur eighth;



48 + (30 / 2);

<<< "Hello()/2!" >>>;

// while(true)++,[1,2]
{
    0 => position;
    for (0 => int i; i < 4; i++)
    {
        i => position;
        for (0 => int j; j < 3; j++)
        {
            Std.mtof(major[j] + offset + position) => osc.freq;
            eighth => now;
        }
    }
}`;
		const formatted = new ChucKFormatter().format(input);
		assert.strictEqual(formatted, expected);
	});
});