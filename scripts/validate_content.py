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

    idx_sources = src.index('var SOURCES')
    idx_vocab = src.index('var VOCAB')
    idx_practice = src.index('var PRACTICE')
    idx_mock = src.index('var MOCK_POOL')
    sources_src = src[idx_sources:idx_vocab]
    vocab_src = src[idx_vocab:idx_practice]
    practice_src = src[idx_practice:idx_mock]
    mock_src = src[idx_mock:]

    sources_defined = set(re.findall(r"^\s*(\w+):\{label:", sources_src, re.M))

    def extract_ids(section, prefix):
        return re.findall(r"id:'(" + prefix + r"\d+)'", section)

    vids = extract_ids(vocab_src, 'v')
    pids = extract_ids(practice_src, 'p')
    mids = extract_ids(mock_src, 'm')
    all_ids = vids + pids + mids
    dup_ids = [k for k, c in Counter(all_ids).items() if c > 1]
    if dup_ids:
        errors.append(f'duplicate id(s): {dup_ids}')

    def check_pool(section, pool_name, correct_is_int):
        pool_errors = []
        choice_blocks = re.findall(r"choices:\[(.*?)\]", section, re.S)
        why_blocks = re.findall(r"why:\[(.*?)\]", section, re.S)
        if len(choice_blocks) != len(why_blocks):
            pool_errors.append(f'{pool_name}: choices/why block count mismatch '
                                f'({len(choice_blocks)} vs {len(why_blocks)})')
        for i, b in enumerate(choice_blocks):
            n = len(STR_RE.findall(b))
            if n != 4:
                pool_errors.append(f'{pool_name}: choices block #{i} has {n} items (expected 4)')
        for i, b in enumerate(why_blocks):
            n = len(STR_RE.findall(b))
            if n != 4:
                pool_errors.append(f'{pool_name}: why block #{i} has {n} items (expected 4)')

        if correct_is_int:
            corrects = re.findall(r"correct:(\d+)", section)
            for c in corrects:
                if not (0 <= int(c) <= 3):
                    pool_errors.append(f'{pool_name}: correct index out of range: {c}')
        else:
            corrects = re.findall(r"correct:\[([^\]]*)\]", section)
            types = re.findall(r"type:'(single|multi)'", section)
            if len(corrects) != len(types):
                pool_errors.append(f'{pool_name}: correct/type count mismatch '
                                    f'({len(corrects)} vs {len(types)})')
            for i, c in enumerate(corrects):
                nums = [int(x.strip()) for x in c.split(',') if x.strip() != '']
                if any(x < 0 or x > 3 for x in nums):
                    pool_errors.append(f'{pool_name}: correct index out of range: {c}')
                if i < len(types):
                    t = types[i]
                    if t == 'single' and len(nums) != 1:
                        pool_errors.append(f'{pool_name}: type=single but correct has {len(nums)} entries: {c}')
                    if t == 'multi' and len(nums) < 2:
                        pool_errors.append(f'{pool_name}: type=multi but correct has {len(nums)} entries: {c}')

        source_refs = set(re.findall(r"source:SOURCES\.(\w+)", section))
        missing = source_refs - sources_defined
        if missing:
            pool_errors.append(f'{pool_name}: undefined source refs: {missing}')

        domain_refs = re.findall(r"domain:'(\w+)'", section)
        bad_domains = set(domain_refs) - VALID_DOMAINS
        if bad_domains:
            pool_errors.append(f'{pool_name}: invalid domain(s): {bad_domains}')

        return pool_errors, Counter(domain_refs), len(domain_refs)

    v_errors, v_domains, v_total = check_pool(vocab_src, 'VOCAB', correct_is_int=True)

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
    p_errors, p_domains, p_total = check_pool(practice_src, 'PRACTICE', correct_is_int=False)
    m_errors, m_domains, m_total = check_pool(mock_src, 'MOCK_POOL', correct_is_int=False)
    errors.extend(v_errors)
    errors.extend(p_errors)
    errors.extend(m_errors)

    print(f'=== counts ({exam}) ===')
    for name, total, domains, target in (
        ('VOCAB', v_total, v_domains, targets['VOCAB']),
        ('PRACTICE', p_total, p_domains, targets['PRACTICE']),
        ('MOCK_POOL', m_total, m_domains, targets['MOCK_POOL']),
    ):
        print(f'{name}: {total} / {target}  domains={dict(domains)}')

    if list_path:
        if list_summary:
            total, done, excluded, doms = list_summary
            print(f'VOCAB list ({list_path}): {done} / {total - excluded} done '
                  f'(excluded {excluded})  domains={dict(doms)}')
        else:
            print(f'VOCAB list ({list_path}): not created yet')

    print('\n=== correct-is-longest rate (target ~25%) ===')
    for name, sec in (('VOCAB', vocab_src), ('PRACTICE', practice_src), ('MOCK_POOL', mock_src)):
        n = longest = 0
        for item in re.split(r"\n(?=\s*\{id:')", sec):
            cm = re.search(r"choices:\[((?:\s*'(?:[^'\\]|\\.)*'\s*,?)+)\]", item)
            co = re.search(r"correct:(\[[^\]]*\]|\d+)", item)
            if not (cm and co):
                continue
            ch = re.findall(r"'((?:[^'\\]|\\.)*)'", cm.group(1))
            idx = [int(x) for x in re.findall(r"\d+", co.group(1))]
            if len(ch) != 4 or not idx:
                continue
            L = [len(c) for c in ch]
            n += 1
            if max(L[i] for i in idx) >= max(L):
                longest += 1
        print(f'{name}: {longest} / {n} ({100 * longest // max(n, 1)}%)')

    if errors:
        print('\n=== errors ===')
        print('\n'.join(errors))
        print(f'\n{len(errors)} error(s) found.')
        return 1

    print('\nOK: no structural errors found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
