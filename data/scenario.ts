
import { ScriptNode } from '../types';
import { parseScript } from '../utils/scriptParser';
import { RAW_SCRIPT } from './rawScript';

export const SCENARIO: Record<string, ScriptNode> = parseScript(RAW_SCRIPT);
