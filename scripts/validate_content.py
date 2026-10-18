#!/usr/bin/env python3
"""
js/data/<試験>.js の構造整合性を検証し、現在の件数を表示する。

このリポジトリは素のJS（ビルドなし）なので、Node.js前提のJSONパーサは使わず、
正規表現ベースで検証する。壊れたデータをコミットする事故を防ぐためのツール。

使い方:
  python3 scripts/validate_content.py            # CLF-C02 (js/data/clf-c02.js)
  python3 scripts/validate_content.py aif-c01    # AIF-C01 (js/data/aif-c01.js)

終了コード 0 = 問題なし。0以外 = 何かしらの不整合あり（詳細はstdoutに出力）。
"""
import re
import sys
from collections import Counter

EXAMS = {
    'clf-c02': {
        'path': 'js/data/clf-c02.js',
        'domains': {'concepts', 'security', 'tech', 'billing'},
        'targets': {'VOCAB': 500, 'PRACTICE': 1500, 'MOCK_POOL': 500},
    },
    'aif-c01': {
        'path': 'js/data/aif-c01.js',
        'domains': {'aiml', 'genai', 'fm', 'responsible', 'security'},
        # VOCABの目標は単語リストの行数（リストが無い間は500）
        'targets': {'VOCAB': 500, 'PRACTICE': 1500, 'MOCK_POOL': 500},
        'vocab_list': 'content/aif-c01-vocab-list.md',
    },
}
STR_RE = re.compile(r"'(?:[^'\\]|\\.)*'")


def check_brace_balance(src):
    stack = []
    in_str = None
    i, n = 0, len(src)
    pairs_close_to_open = {'}': '{', ']': '[', ')': '('}
    while i < n:
        c = src[i]
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in "'\"":
            in_str = c
            i += 1
            continue
        if c in '{[(':
            stack.append(c)
        elif c in '}])':
            if not stack:
                return False, f'unmatched closing "{c}" at offset {i}'
            top = stack.pop()
            if pairs_close_to_open[c] != top:
                return False, f'mismatched "{c}" at offset {i} (expected close for "{top}")'
        i += 1
    if stack:
        return False, f'unclosed: {stack}'
    if in_str is not None:
        return False, 'unterminated string literal'
    return True, None


def main():
    exam = sys.argv[1] if len(sys.argv) > 1 else 'clf-c02'
    if exam not in EXAMS:
        print(f'FATAL: unknown exam "{exam}" (choose from {sorted(EXAMS)})')
        return 2
    PATH = EXAMS[exam]['path']
    VALID_DOMAINS = EXAMS[exam]['domains']
    targets = EXAMS[exam]['targets']
    errors = []
    try:
        src = open(PATH, encoding='utf-8').read()
    except OSError as e:
        print(f'FATAL: cannot read {PATH}: {e}')
        return 2

    ok, msg = check_brace_balance(src)
    if not ok:
        errors.append(f'brace/bracket/paren balance error: {msg}')
        # 構文が壊れていると以降の正規表現も信用できないので、ここで打ち切る
        print('\n'.join(errors))
        print(f'\n{len(errors)} error(s) found.')
        return 1

    for marker in ('var SOURCES', 'var VOCAB', 'var PRACTICE', 'var MOCK_POOL'):
        if marker not in src:
            errors.append(f'missing "{marker}" declaration')
    if errors:
        print('\n'.join(errors))
        print(f'\n{len(errors)} error(s) found.')
        return 1


    def section(start_marker, end_marker=None):
        start = src.index(start_marker)
        end = src.index(end_marker) if end_marker else len(src)
        sec = src[start:end]
        # 配列の閉じ「];」以降（試験登録コードなど）は対象外
        close = sec.find('\n];')
        return sec[:close] if close != -1 else sec

    sources_src = section('var SOURCES', 'var VOCAB')
    vocab_src = section('var VOCAB', 'var PRACTICE')
    practice_src = section('var PRACTICE', 'var MOCK_POOL')
    mock_src = section('var MOCK_POOL')

    sources_defined = set(re.findall(r"^\s*(\w+):\{label:", sources_src, re.M))

    def split_items(sec):
        return [it for it in re.split(r"\n(?=\s*\{id:')", sec) if re.match(r"\s*\{id:'", it)]

    def get_array(item, key):
        """item 内の `key:[ ... ]` の中身を返す（文字列内の括弧は無視）。無ければ None。"""
        m = re.search(r"(?<![\w.])" + key + r":\[", item)
        if not m:
            return None
        i, depth, in_str = m.end(), 1, False
        while i < len(item):
            c = item[i]
            if in_str:
                if c == '\\':
                    i += 2
                    continue
                if c == "'":
                    in_str = False
            elif c == "'":
                in_str = True
            elif c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return item[m.end():i]
            i += 1
        return None

    def strs(raw):
        return [] if raw is None else STR_RE.findall(raw)

    def ints(raw):
        return [] if raw is None else [int(x) for x in re.findall(r"-?\d+", raw)]

    TYPES = ('single', 'multi', 'ordering', 'matching')

    def check_pool(sec, pool_name, is_vocab):
        pool_errors = []
        items = split_items(sec)
        stats = {'domains': Counter(), 'types': Counter(), 'n': len(items),
                 'longest': 0, 'choice_n': 0, 'single_pos': Counter()}
        for item in items:
            iid = re.match(r"\s*\{id:'(\w+)'", item).group(1)

            def err(msg):
                pool_errors.append(f'{pool_name} {iid}: {msg}')

            dm = re.search(r"domain:'(\w+)'", item)
            if not dm or dm.group(1) not in VALID_DOMAINS:
                err(f'invalid or missing domain: {dm.group(1) if dm else None}')
            else:
                stats['domains'][dm.group(1)] += 1
            sm = re.search(r"source:SOURCES\.(\w+)", item)
            if not sm:
                err('missing source')
            elif sm.group(1) not in sources_defined:
                err(f'undefined source ref: {sm.group(1)}')

            why = strs(get_array(item, 'why'))
            if is_vocab:
                qtype = 'single'
                cm = re.search(r"correct:(\d+)", item)
                correct = [int(cm.group(1))] if cm else []
                if not re.search(r"term:'", item):
                    err('missing term')
            else:
                tm = re.search(r"type:'(\w+)'", item)
                qtype = tm.group(1) if tm else None
                if qtype not in TYPES:
                    err(f'invalid type: {qtype}')
                    continue
                correct = ints(get_array(item, 'correct'))
            stats['types'][qtype] += 1

            if qtype in ('single', 'multi'):
                choices = strs(get_array(item, 'choices'))
                n_ok = (len(choices) == 4) if (is_vocab or qtype == 'single') else (4 <= len(choices) <= 6)
                if not n_ok:
                    err(f'{qtype}: choices has {len(choices)} items')
                if len(why) != len(choices):
                    err(f'why has {len(why)} items (choices has {len(choices)})')
                if any(c < 0 or c >= len(choices) for c in correct) or len(set(correct)) != len(correct):
                    err(f'correct out of range or duplicated: {correct}')
                if qtype == 'single' and len(correct) != 1:
                    err(f'type=single but correct has {len(correct)} entries')
                if qtype == 'multi' and not (2 <= len(correct) < len(choices)):
                    err(f'type=multi but correct has {len(correct)} entries')
                if choices and correct and all(0 <= c < len(choices) for c in correct):
                    L = [len(c) for c in choices]
                    stats['choice_n'] += 1
                    if max(L[c] for c in correct) >= max(L):
                        stats['longest'] += 1
                    if qtype == 'single':
                        stats['single_pos'][correct[0]] += 1
            elif qtype == 'ordering':
                steps = strs(get_array(item, 'items'))
                if not (3 <= len(steps) <= 5):
                    err(f'ordering: items has {len(steps)} entries (expected 3-5)')
                if len(set(steps)) != len(steps):
                    err('ordering: duplicated items')
                if len(why) != len(steps):
                    err(f'ordering: why has {len(why)} items (items has {len(steps)})')
                if get_array(item, 'choices') is not None or get_array(item, 'correct') is not None:
                    err('ordering: must not have choices/correct (items are listed in the correct order)')
            elif qtype == 'matching':
                prompts = strs(get_array(item, 'prompts'))
                options = strs(get_array(item, 'options'))
                if not (3 <= len(prompts) <= 7):
                    err(f'matching: prompts has {len(prompts)} entries (expected 3-7)')
                if not (len(prompts) <= len(options) <= 7):
                    err(f'matching: options has {len(options)} entries (expected {len(prompts)}-7)')
                if len(set(options)) != len(options):
                    err('matching: duplicated options')
                if len(correct) != len(prompts):
                    err(f'matching: correct has {len(correct)} entries (prompts has {len(prompts)})')
                if any(c < 0 or c >= len(options) for c in correct):
                    err(f'matching: correct out of range: {correct}')
                if len(why) != len(prompts):
                    err(f'matching: why has {len(why)} items (prompts has {len(prompts)})')
                if get_array(item, 'choices') is not None:
                    err('matching: must not have choices')
        return pool_errors, stats

    v_errors, v_stats = check_pool(vocab_src, 'VOCAB', is_vocab=True)
    p_errors, p_stats = check_pool(practice_src, 'PRACTICE', is_vocab=False)
    m_errors, m_stats = check_pool(mock_src, 'MOCK_POOL', is_vocab=False)
    errors.extend(v_errors + p_errors + m_errors)

    vids = re.findall(r"\{id:'(\w+)'", vocab_src)
    pids = re.findall(r"\{id:'(\w+)'", practice_src)
    mids = re.findall(r"\{id:'(\w+)'", mock_src)
    for name, ids, prefix in (('VOCAB', vids, 'v'), ('PRACTICE', pids, 'p'), ('MOCK_POOL', mids, 'm')):
        bad = [i for i in ids if not re.fullmatch(prefix + r"\d+", i)]
        if bad:
            errors.append(f'{name}: id(s) must be "{prefix}<number>": {bad}')
    dup_ids = [k for k, c in Counter(vids + pids + mids).items() if c > 1]
    if dup_ids:
        errors.append(f'duplicate id(s): {dup_ids}')

    # 単語リスト（全単語を先に列挙し、上から順にVOCABへ埋めていく方式）の整合性チェック
    list_path = EXAMS[exam].get('vocab_list')
    list_summary = None
    if list_path:
        try:
            list_src = open(list_path, encoding='utf-8').read()
        except OSError:
            list_src = None
        if list_src is not None:
            rows = re.findall(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\w+)\s*\|\s*(\S+)\s*\|\s*$", list_src, re.M)
            vocab_terms = dict(re.findall(r"id:'(v\d+)', term:'((?:[^'\\]|\\.)*)'", vocab_src))
            nums = [int(r[0]) for r in rows]
            if nums != list(range(1, len(rows) + 1)):
                errors.append(f'{list_path}: row numbers must be 1..{len(rows)} in order')
            dup_terms = [t for t, c in Counter(r[1].lower() for r in rows).items() if c > 1]
            if dup_terms:
                errors.append(f'{list_path}: duplicate term(s): {dup_terms}')
            done_ids = []
            for num, term, dom, status in rows:
                if dom not in VALID_DOMAINS:
                    errors.append(f'{list_path}: row {num}: invalid domain "{dom}"')
                if status in ('未', '除外'):
                    continue
                if status not in vocab_terms:
                    errors.append(f'{list_path}: row {num}: status "{status}" is not a VOCAB id')
                elif vocab_terms[status] != term:
                    errors.append(f'{list_path}: row {num}: term "{term}" != VOCAB {status} term "{vocab_terms[status]}"')
                done_ids.append(status)
            dup_done = [k for k, c in Counter(done_ids).items() if c > 1]
            if dup_done:
                errors.append(f'{list_path}: VOCAB id(s) used by multiple rows: {dup_done}')
            unlisted = sorted(set(vocab_terms) - set(done_ids), key=lambda x: int(x[1:]))
            if unlisted:
                errors.append(f'{list_path}: VOCAB id(s) not linked from the list: {unlisted}')
            excluded = sum(1 for r in rows if r[3] == '除外')
            targets = dict(targets, VOCAB=len(rows) - excluded)
            list_summary = (len(rows), len(done_ids), excluded, Counter(r[2] for r in rows if r[3] != '除外'))

    pools = (('VOCAB', v_stats), ('PRACTICE', p_stats), ('MOCK_POOL', m_stats))
    print(f'=== counts ({exam}) ===')
    for name, st in pools:
        types = '' if name == 'VOCAB' else f'  types={dict(st["types"])}'
        print(f'{name}: {st["n"]} / {targets[name]}  domains={dict(st["domains"])}{types}')

    if list_path:
        if list_summary:
            total, done, excluded, doms = list_summary
            print(f'VOCAB list ({list_path}): {done} / {total - excluded} done '
                  f'(excluded {excluded})  domains={dict(doms)}')
        else:
            print(f'VOCAB list ({list_path}): not created yet')

    print('\n=== correct-is-longest rate, single/multi only (target ~25%) ===')
    for name, st in pools:
        print(f'{name}: {st["longest"]} / {st["choice_n"]} ({100 * st["longest"] // max(st["choice_n"], 1)}%)')

    print('\n=== correct position of single-answer items (should be roughly even) ===')
    for name, st in pools:
        print(f'{name}: ' + ' '.join(f'{i}:{st["single_pos"][i]}' for i in range(4)))

    if errors:
        print('\n=== errors ===')
        print('\n'.join(errors))
        print(f'\n{len(errors)} error(s) found.')
        return 1

    print('\nOK: no structural errors found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
