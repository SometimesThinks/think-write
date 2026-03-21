#!/usr/bin/env python3

import argparse
import json
import subprocess
import sys


def run_git(args):
    result = subprocess.run(
        ['git', *args],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def parse_name_status(text):
    files = []
    for line in text.splitlines():
        if not line.strip():
            continue
        parts = line.split('\t', 1)
        if len(parts) == 2:
            status, path = parts
        else:
            status, path = parts[0], ''
        files.append({'status': status, 'path': path})
    return files


def parse_status_short(text):
    files = []
    for line in text.splitlines():
        if not line.strip():
            continue
        status = line[:2]
        path = line[3:] if len(line) > 3 else ''
        files.append({'status': status, 'path': path})
    return files


def limit_text(text, max_chars=12000):
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + '\n...[truncated]'


def staged_payload():
    return {
        'mode': 'staged',
        'name_status': run_git(['diff', '--cached', '--name-status']),
        'diff_stat': run_git(['diff', '--cached', '--stat']),
        'patch': run_git(['diff', '--cached', '--unified=3', '--no-ext-diff']),
    }


def working_payload():
    return {
        'mode': 'working',
        'status_short': run_git(['status', '--short']),
        'name_status': run_git(['diff', '--name-status']),
        'diff_stat': run_git(['diff', '--stat']),
        'patch': run_git(['diff', '--unified=3', '--no-ext-diff']),
    }


def rev_payload(rev):
    return {
        'mode': 'rev',
        'rev': rev,
        'name_status': run_git(['show', '--format=', '--name-status', rev]),
        'diff_stat': run_git(['show', '--format=', '--stat', '--stat-width=120', rev]),
        'patch': run_git(['show', '--format=', '--unified=3', '--no-ext-diff', rev]),
        'subject': run_git(['show', '-s', '--format=%s', rev]).strip(),
        'full_sha': run_git(['rev-parse', rev]).strip(),
        'short_sha': run_git(['rev-parse', '--short', rev]).strip(),
    }


def has_visible_changes(payload, mode):
    if mode == 'working':
        files = parse_status_short(payload.get('status_short', ''))
    else:
        files = parse_name_status(payload.get('name_status', ''))

    return bool(files or payload.get('diff_stat', '').strip() or payload.get('patch', '').strip())


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--staged', action='store_true')
    group.add_argument('--working', action='store_true')
    group.add_argument('--rev')
    args = parser.parse_args()

    repo_root = run_git(['rev-parse', '--show-toplevel']).strip()
    branch = run_git(['rev-parse', '--abbrev-ref', 'HEAD']).strip()
    recent_subjects = [
        line for line in run_git(['log', '--pretty=format:%s', '-n', '10']).splitlines() if line.strip()
    ]

    if args.rev:
        payload = rev_payload(args.rev)
        requested_mode = 'rev'
    elif args.working:
        payload = working_payload()
        requested_mode = 'working'
    elif args.staged:
        payload = staged_payload()
        requested_mode = 'staged'
    else:
        requested_mode = 'auto'
        staged = staged_payload()
        if has_visible_changes(staged, 'staged'):
            payload = staged
        else:
            payload = working_payload()

    if payload['mode'] == 'working':
        files = parse_status_short(payload.get('status_short', ''))
    else:
        files = parse_name_status(payload['name_status'])

    diff_stat = payload['diff_stat'].strip()
    patch_excerpt = limit_text(payload['patch'])
    empty = len(files) == 0 and not diff_stat and not patch_excerpt

    output = {
        'repo_root': repo_root,
        'branch': branch,
        'requested_mode': requested_mode,
        'mode': payload['mode'],
        'rev': payload.get('rev'),
        'subject': payload.get('subject'),
        'full_sha': payload.get('full_sha'),
        'short_sha': payload.get('short_sha'),
        'recent_subjects': recent_subjects,
        'files': files,
        'file_count': len(files),
        'empty': empty,
        'diff_stat': diff_stat,
        'patch_excerpt': patch_excerpt,
    }

    json.dump(output, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
