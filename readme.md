# Notes MD

A CLI tool for managing a personal Markdown knowledge base — automatic tag indexes, back-links, link validation and Git sync. Think Obsidian, but plain files and one terminal command.

## Features

- **Index** — scans `#tags` in your notes, builds `index.md` and per-tag pages, inserts back-links and related-note links automatically
- **Check links** — finds broken local links across all Markdown files
- **Check structure** — detects duplicate file names
- **Sync** — commits and pushes your notes to a remote Git repository in one command

## Requirements

- Node.js 16+
- Git (for `sync`)

## Installation

```shell
npm install -g notes-md
```

## Quick Start

1. Create a `notes.config.json` in your notes folder (see [Configuration](#configuration))
2. Add `#tags` to your notes (see [Note format](#note-format))
3. Run `nmd index` to build the index
4. Run `nmd sync` to push everything to Git

## Commands

| Command | Short | Description |
|---|---|---|
| `nmd sync` | `nmd s` | Commit and push notes to remote Git |
| `nmd index` | `nmd i` | Build tag index, tag pages and back-links |
| `nmd check-links` | `nmd cl` | Report broken local links |
| `nmd check-structure` | `nmd cs` | Detect duplicate file names |

## Note format

Notes are plain Markdown files. Add a `tags:` line anywhere in the file to categorize it:

```markdown
# My Note Title

Some content here.

tags: #programming #productivity #books
```

After running `nmd index`, each note gets a `### see also:` section appended with links to related notes and tag pages.

## Configuration

Create a `notes.config.json` in the root of your notes folder:

```json
{
  "folders": {
    "notes": "notes",
    "diary": "diary"
  },
  "notes": {
    "separator": "### see also:",
    "maxOtherLinksNumber": 5
  },
  "synonyms": {
    "programming": ["программирование"],
    "productivity": ["продуктивность"],
    "books": ["книги", "book"]
  }
}
```

| Field | Description |
|---|---|
| `folders.notes` | Folder with your notes (relative to config file) |
| `folders.diary` | Folder with diary entries |
| `notes.separator` | Section heading used to separate auto-generated links |
| `notes.maxOtherLinksNumber` | Max number of related-note links inserted per file |
| `synonyms` | Tag aliases — maps variants (including other languages) to a canonical tag |

## Folder structure

```
my-notes/
├── notes.config.json
├── notes/
│   ├── index.md          ← generated tag index
│   ├── tags/             ← generated per-tag pages
│   │   ├── programming.md
│   │   └── books.md
│   ├── note_one.md
│   └── 2024/
│       └── note_two.md
└── diary/
    └── 2024/
        └── week_01.md
```

## Why Notes MD?

"Notes MD" sounds like "House MD" — a genius doctor with a bad sense of humor. This tool won't diagnose you, but it might heal your note-taking habits.

## License

ISC
