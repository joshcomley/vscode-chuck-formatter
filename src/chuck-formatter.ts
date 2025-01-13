interface Literal {
    start: number;
    length: number;
    value: string;
    token: string;
}

interface Replacement {
    token: string;
    isOperation?: boolean;
}

interface Token {
    token: string;
    operator: string;
    data?: any;
    pair?: Token;
    remove?: boolean;
}

class ChucKFormatter {
    private indentString: string = "    ";
    private literalRegExp = `[A-Z_]+_LITERAL_\\d+`;
    private eolCommentLiterals: string[] = [];
    sortedTokens: Replacement[];
    sortedKeys: string[];
    replacements: { [key: string]: Replacement };
    replacementsInverted: { [key: string]: string };

    constructor() {
        this.replacements = {
            "::": { token: "CHUCK_COLON_COLON" },
            ".": { token: "CHUCK_PERIOD" },
            ",": { token: "CHUCK_COMMA" },
            ";": { token: "CHUCK_SEMICOLON" },
            "[": { token: "CHUCK_OPEN_SQUARE" },
            "]": { token: "CHUCK_CLOSE_SQUARE" },
            "{": { token: "CHUCK_OPEN_BRACE" },
            "}": { token: "CHUCK_CLOSE_BRACE" },
            "(": { token: "CHUCK_OPEN_PAREN" },
            ")": { token: "CHUCK_CLOSE_PAREN" },

            "int": { token: "CHUCK_INT" },
            "float": { token: "CHUCK_FLOAT" },
            "string": { token: "CHUCK_STRING" },
            "void": { token: "CHUCK_VOID" },
            "fun": { token: "CHUCK_FUN" },
            "while": { token: "CHUCK_WHILE" },
            "if": { token: "CHUCK_IF" },
            "else": { token: "CHUCK_ELSE" },
            "for": { token: "CHUCK_FOR" },
            "return": { token: "CHUCK_RETURN" },

            "<<<": { token: "CHUCK_OPEN_TRIPLE_ANGLE" },
            ">>>": { token: "CHUCK_CLOSE_TRIPLE_ANGLE" },

            "++": { token: "CHUCK_INCREMENT", isOperation: true },
            "--": { token: "CHUCK_DECREMENT", isOperation: true },

            "!=": { token: "CHUCK_NOT_EQUAL", isOperation: true },
            "<=": { token: "CHUCK_LESS_OR_EQUAL", isOperation: true },
            ">=": { token: "CHUCK_GREATER_OR_EQUAL", isOperation: true },

            "&&": { token: "CHUCK_AND", isOperation: true },
            "||": { token: "CHUCK_OR", isOperation: true },

            "^": { token: "CHUCK_BITWISE_XOR_EQUAL", isOperation: true },
            "&": { token: "CHUCK_BITWISE_AND", isOperation: true },
            "|": { token: "CHUCK_BITWISE_OR", isOperation: true },

            "=^": { token: "CHUCK_BITWISE_XOR_EQUAL", isOperation: true },
            "=|": { token: "CHUCK_BITWISE_OR_EQUAL", isOperation: true },
            "=&": { token: "CHUCK_BITWISE_AND_EQUAL", isOperation: true },

            ">>": { token: "CHUCK_SHIFT_RIGHT", isOperation: true },
            "<<": { token: "CHUCK_SHIFT_LEFT", isOperation: true },

            "=>>": { token: "CHUCK_SHIFT_RIGHT_EQUAL", isOperation: true },
            "=<<": { token: "CHUCK_SHIFT_LEFT_EQUAL", isOperation: true },

            "@=>": { token: "CHUCK_AT_ASSIGN", isOperation: true },
            "~>": { token: "CHUCK_TILDE_ASSIGN", isOperation: true },
            "=>": { token: "CHUCK_ASSIGN", isOperation: true },
            "+=>": { token: "CHUCK_ADD_ASSIGN", isOperation: true },
            "-=>": { token: "CHUCK_SUBTRACT_ASSIGN", isOperation: true },
            "/=>": { token: "CHUCK_DIVIDE_ASSIGN", isOperation: true },
            "*=>": { token: "CHUCK_MULTIPLY_ASSIGN", isOperation: true },
            "%=>": { token: "CHUCK_MODULO_ASSIGN", isOperation: true },
            "&=>": { token: "CHUCK_BITWISE_AND_ASSIGN", isOperation: true },
            "|=>": { token: "CHUCK_BITWISE_OR_ASSIGN", isOperation: true },
            "^=>": { token: "CHUCK_BITWISE_XOR_ASSIGN", isOperation: true },

            "+": { token: "CHUCK_PLUS", isOperation: true },
            "-": { token: "CHUCK_SUBTRACT", isOperation: true },
            "+ ": { token: "CHUCK_PLUS_SPACE", isOperation: true },
            "- ": { token: "CHUCK_SUBTRACT_SPACE", isOperation: true },
            "+\t": { token: "CHUCK_PLUS_SPACE", isOperation: true },
            "-\t": { token: "CHUCK_SUBTRACT_SPACE", isOperation: true },
            "*": { token: "CHUCK_MULTIPLY", isOperation: true },
            "/": { token: "CHUCK_DIVIDE", isOperation: true },
            "%": { token: "CHUCK_MODULO", isOperation: true },
            "=": { token: "CHUCK_EQUAL", isOperation: true },
            "!": { token: "CHUCK_NOT", isOperation: true },
            "<": { token: "CHUCK_LESS_THAN", isOperation: true },
            ">": { token: "CHUCK_GREATER_THAN", isOperation: true },

            "\n": { token: "CHUCK_NEWLINE" },
        };

        this.replacementsInverted = {};
        for (const op of Object.keys(this.replacements)) {
            this.replacementsInverted[this.replacements[op].token] = op;
        }

        let sortedTokens = new Array<Replacement>();
        this.sortedKeys = Object.keys(this.replacements).sort((a, b) => b.length - a.length);
        for (const op of this.sortedKeys) {
            sortedTokens.push(this.replacements[op]);
        }
        this.sortedTokens = sortedTokens.sort((a, b) => b.token.length - a.token.length);

    }

    private toTokens(code: string): Token[] {
        // Extract and tokenize EOL comment literals
        code = code.replace(/(\s*\/\/.*)/g, (match, p1) => {
            const token = `EOL_COMMENT_LITERAL_${this.eolCommentLiterals.length}`;
            this.eolCommentLiterals.push(match);
            return token;
        });

        for (const op of this.sortedKeys) {
            const regex = new RegExp(op.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "g");
            code = code.replace(regex, this.replacements[op].token);
        }

        const tokens = code.split(new RegExp(`(${this.sortedTokens.map(t => t.token).join("|")}|${this.literalRegExp})`))
            .map(t => t.trim())
            .filter(t => !!t)
            .map<Token>(t => {
                return {
                    token: t,
                    operator: this.replacementsInverted[t],
                    data: null
                };
            });
        tokens.push({ operator: "\n", token: "CHUCK_NEWLINE" });
        return tokens;
    }

    private formatTokens(tokens: Token[]): string {
        let normalized = "";

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].operator) {
                switch (tokens[i].operator) {
                    case "{":
                    case "}":
                        for (let j = i - 1; j > 0; j--) {
                            if (tokens[j].operator === "\n") {
                                tokens[j].remove = true;
                            } else {
                                break;
                            }
                        }
                        for (let j = i + 1; j < tokens.length; j++) {
                            if (tokens[j].operator === "\n") {
                                tokens[j].remove = true;
                            } else {
                                break;
                            }
                        }
                        break;
                }
            }
        }

        tokens = tokens.filter(t => !t.remove);

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const previousToken = tokens[i - 1];
            const nextToken = tokens[i + 1];
            if (token.operator) {
                switch (token.operator) {
                    case "[":
                        let withinSquare = new Array<Token>();
                        let depth = 0;
                        for (let j = i + 1; j < tokens.length; j++) {
                            if (tokens[j].token === "CHUCK_OPEN_SQUARE") {
                                depth++;
                            } else if (tokens[j].token === "CHUCK_CLOSE_SQUARE") {
                                if (depth === 0) {
                                    tokens[j].pair = token;
                                    token.pair = tokens[j];
                                    break;
                                } else {
                                    depth--;
                                }
                            }
                            withinSquare.push(tokens[j]);
                        }
                        token.data = withinSquare;
                        if (withinSquare.length > 1) {
                            normalized += `${token.operator} `;
                        } else {
                            normalized += token.operator;
                        }
                        break;
                    case "]":
                        if ((token.pair?.data as []).length > 1) {
                            normalized += ` ${token.operator}`;
                        } else {
                            normalized += token.operator;
                        }
                        break;
                    case "++":
                    case "--":
                        normalized += token.operator;
                        break;
                    case "+ ":
                    case "- ":
                    case "+\t":
                    case "-\t":
                        normalized += ` ${token.operator} `;
                        break;
                    case "+":
                    case "-":
                        if (previousToken?.operator === "(") {
                            if (!!nextToken?.operator) {
                                normalized += `${token.operator} `;
                            } else {
                                normalized += `${token.operator}`;
                            }
                        } else if (!!nextToken?.operator) {
                            normalized += ` ${token.operator} `;
                        } else {
                            normalized += ` ${token.operator}`;
                        }
                        break;
                    case "{":
                    case "}":
                        if (previousToken?.operator === token.operator) {
                            normalized += `${token.operator}\n`;
                        } else {
                            normalized += `\n${token.operator}\n`;
                        }
                        break;
                    case ",":
                    case "<<<":
                    case ";":
                    case "int":
                    case "int":
                    case "float":
                    case "string":
                    case "void":
                    case "fun":
                    case "while":
                    case "if":
                    case "else":
                    case "for":
                    case "return":
                    case "/*":
                    case "*/":
                        normalized += `${token.operator} `;
                        break;
                    case ">>>":
                        normalized += ` ${token.operator}`;
                        break;
                    default:
                        if (this.replacements[token.operator].isOperation) {
                            normalized += ` ${token.operator} `;
                        }
                        else {
                            normalized += token.operator;
                        }
                        break;
                }
            } else {
                if (new RegExp(this.literalRegExp).exec(token.token)) {
                    normalized += ` ${token.token} `;
                } else {
                    normalized += token.token;
                }
            }
        }

        this.eolCommentLiterals.forEach((literal, index) => {
            normalized = normalized.replace(new RegExp(`EOL_COMMENT_LITERAL_${index}`, "g"), ` ${literal}`);
        });

        normalized = normalized.replace(/[^\S\n]+/g, " ");

        return normalized.trim();
    }

    private replaceWithin(code: string, left: string, right: string, token: string): [string, Literal[]] {
        let literals = new Array<Literal>();
        let started = false;
        let currentLiteral = "";
        for (let i = 0; i < code.length;) {
            if (!started && code.substring(i, i + left.length) === left) {
                started = true;
                currentLiteral += left;
                i += left.length;
            } else if (started === true && code.substring(i, i + right.length) === right) {
                started = false;
                currentLiteral += right;
                literals.push({
                    start: i,
                    length: currentLiteral.length,
                    value: currentLiteral,
                    token: token + (literals.length + 1)
                });
                currentLiteral = "";
                i++;
            } else if (started) {
                currentLiteral += code[i];
                i++;
            } else {
                i++;
            }
        }
        for (let i = 0; i < literals.length; i++) {
            const l = literals[i];
            code = code.replace(l.value, l.token);
        }
        return [code, literals];
    }

    public format(code: string): string {
        let stringLiterals: Literal[] = [];
        let mlCommentLiterals: Literal[] = [];

        [code, stringLiterals] = this.replaceWithin(code, '"', '"', "STRING_LITERAL_");
        [code, mlCommentLiterals] = this.replaceWithin(code, '/*', '*/', "ML_COMMENT_LITERAL_");

        const tokens = code.split(/\r?\n/).flatMap(l => this.toTokens(l));

        const lines = this.formatTokens(tokens).split(/\r?\n/).map(l => l.trim());
        let indent = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line === "{") {
                lines[i] = `${this.indentString.repeat(indent)}${lines[i]}`;
                indent++;
            } else if (line === "}") {
                indent--;
                lines[i] = `${this.indentString.repeat(indent)}${lines[i]}`;
            } else {
                lines[i] = `${this.indentString.repeat(indent)}${lines[i]}`;
            }
        }
        let output = lines.join('\n');

        for (let i = 0; i < stringLiterals.length; i++) {
            output = output.replace(
                stringLiterals[i].token,
                stringLiterals[i].value
            );
        }
        for (let i = 0; i < mlCommentLiterals.length; i++) {
            output = output.replace(
                mlCommentLiterals[i].token,
                mlCommentLiterals[i].value
            );
        }
        return output.trim();
    }
}

export { ChucKFormatter };