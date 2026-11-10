# ClearLot design system

Direction: a clear winter morning. Cold, quiet neutrals with one high-visibility orange, the
colour of a plow beacon, reserved for the action we want people to take. Light theme only.

## Colour (tokens in `src/app/globals.css`)

| Token | Value | Role |
|---|---|---|
| `ink` | `#0f1a24` | Text, dark sections |
| `ink-soft` / `ink-faint` | `#46535f` / `#6b7884` | Secondary text, hints (both pass AA on `snow`) |
| `snow` | `#f4f7f9` | Page background |
| `paper` | `#ffffff` | Cards, inputs |
| `line` | `#d9e1e7` | Borders, dividers |
| `ice` | `#e3f0f5` | Tinted panels, notices |
| `accent` | `#ff6a1a` | Primary buttons and the selected state only. Text on it is `accent-ink`, never white |
| `driveway` / `sidewalk` / `walkway` | `#ff6a1a` / `#19b8d6` / `#e8c400` | Surface outlines on the satellite image, always paired with a text label |

## Type

- Display: Bricolage Grotesque (headings, prices), tight tracking, balanced wrapping.
- Body: Instrument Sans, 16px minimum, 1.5 line height.
- Numbers in prices and measurements use tabular figures.

## Shape and spacing

- Controls: 10px radius, 48px tall (44px for compact toolbar buttons).
- Cards: 16px radius, 1px `line` border; shadow only on things that float.
- Sections: 80 to 112px vertical padding on desktop, 56px on phones. Content width 1120px.

## Components

- `.btn .btn-primary`: one per view. Label says what happens ("Measure my property").
- `.btn .btn-quiet`: everything else.
- `.field`: text inputs. Every field has a visible label.
- `.card`: white surface with border.

## Voice

Plain and specific. Say what we clear, when we come and what it costs. No invented reviews,
counts or guarantees: anything promised on the site must be something the crews actually do.
