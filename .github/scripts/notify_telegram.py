"""GitHub Actions: send this repository's event to the separate notification bot."""

import json
import os
import urllib.error
import urllib.request


def commit_details(repository: str, sha: str, token: str) -> dict:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{repository}/commits/{sha}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def describe_event(event: dict, environment: dict, get_commit=commit_details) -> str:
    repository = environment["GITHUB_REPOSITORY"]
    actor = environment["GITHUB_ACTOR"]
    kind = environment["GITHUB_EVENT_NAME"]
    action = event.get("action", "")
    detail = f"{kind} {action}".strip()
    url = f"https://github.com/{repository}"

    if kind in ("push", "workflow_dispatch"):
        sha = (event.get("after") if kind == "push" else None) or environment["GITHUB_SHA"]
        if sha == "0" * 40:
            return ""
        commit = get_commit(repository, sha, environment["GITHUB_TOKEN"])
        headline = commit["commit"]["message"].splitlines()[0]
        author = (commit.get("author") or {}).get("login") or (
            commit["commit"]["author"].get("name", actor)
        )
        filenames = [item["filename"] for item in commit.get("files", [])]
        summary = ", ".join(filenames[:5]) or "Not available"
        if len(filenames) > 5:
            summary += f" (+{len(filenames) - 5} more)"
        label = "Latest commit (manual run)" if kind == "workflow_dispatch" else "New push"
        detail = (
            f"{label}\nBranch: {environment['GITHUB_REF_NAME']}\n"
            f"Commit: {sha[:7]}\nAuthor: {author}\n"
            f"Message: {headline}\nFiles: {summary}"
        )
        url = commit.get("html_url") or f"{url}/commit/{sha}"
    elif kind == "pull_request_target":
        pr = event["pull_request"]
        status = "merged" if action == "closed" and pr.get("merged") else action
        detail = f"Pull request #{pr['number']} {status}: {pr['title']}"
        url = pr["html_url"]
    elif kind == "issues":
        issue = event["issue"]
        detail = f"Issue #{issue['number']} {action}: {issue['title']}"
        url = issue["html_url"]
    elif kind == "release":
        release = event["release"]
        detail = f"New release: {release.get('tag_name', '(untagged)')}"
        url = release["html_url"]
    elif kind in ("create", "delete"):
        verb = "created" if kind == "create" else "deleted"
        detail = f"{event.get('ref_type', 'reference')} {event.get('ref', '')} {verb}"

    return f"Repository: {repository}\nBy: {actor}\n{detail}\n{url}"[:3500]


def main() -> None:
    env = os.environ
    service_url = env.get("GITHUB_NOTIFIER_URL", "").rstrip("/")
    secret = env.get("GITHUB_NOTIFIER_SECRET", "")
    if not service_url:
        print("Telegram subscriber notifications are disabled: GITHUB_NOTIFIER_URL not set.")
        return
    if not service_url.startswith("https://") or not secret:
        raise SystemExit("Set an HTTPS GITHUB_NOTIFIER_URL and GITHUB_NOTIFIER_SECRET")
    with open(env["GITHUB_EVENT_PATH"], encoding="utf-8") as stream:
        event = json.load(stream)
    details = describe_event(event, env)
    if not details:
        print("No commit to report for this event.")
        return
    request = urllib.request.Request(
        service_url + "/broadcast",
        data=json.dumps({
            "event_id": env["GITHUB_RUN_ID"],
            "repository": env["GITHUB_REPOSITORY"],
            "message": details,
        }).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Notifier-Secret": secret,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        raise SystemExit(
            f"Notifier API returned HTTP {exc.code}; check deployment and shared secret."
        ) from None
    except urllib.error.URLError:
        raise SystemExit("Cannot reach the standalone Telegram notifier service") from None
    print(
        f"Notifications sent: {result['sent']}; "
        f"already notified: {result['previously_sent']}."
    )


if __name__ == "__main__":
    main()
