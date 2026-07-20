📢 Use this project, [contribute](https://github.com/AlexJSant/disclosure-layout-custom) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# Disclosure Linked Data Layout

<!-- DOCS-IGNORE:start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- DOCS-IGNORE:end -->

The Disclosure Linked Data Layout app creates a disclosure (accordion) layout and can optionally emit [schema.org `FAQPage`](https://schema.org/FAQPage) JSON-LD for Google rich snippets.

![Disclosure Example](https://cdn.jsdelivr.net/gh/vtexdocs/dev-portal-content@main/images/vtex-disclosure-layout-0.gif) [Check this example](https://github.com/vtex-apps/store-theme/pull/226)

## Configuration

### Step 1 - Adding the Disclosure Linked Data Layout app to your theme dependencies

In the `manifest.json` file of your theme, add the app as a dependency:

```diff
  "dependencies": {
+   "{appVendor}.disclosure-ld-layout": "1.x"
  }
```

Now, you can use all the blocks exported by the `disclosure-ld-layout` app. See the full list below:

| Block name | Description |
| - | - |
| `disclosure-ld-layout` | ![https://img.shields.io/badge/-Mandatory-red](https://img.shields.io/badge/-Mandatory-red) Parent block that enables you to build the disclosure layout using its three children blocks: `disclosure-ld-trigger`, `disclosure-ld-content`, and `disclosure-ld-state-indicator`. |
| `disclosure-ld-trigger` | Declares the blocks that will be rendered as disclosure triggers, i.e., the blocks that, when clicked, will open or close the disclosure content (defined by the `disclosure-ld-content` block). |
| `disclosure-ld-content` | Declares the blocks displaying the desired content when the disclosure trigger is clicked. |
| `disclosure-ld-state-indicator` | Optional block that renders the chevron or other UI elements that change when the disclosure is opened or closed. |
| `disclosure-ld-layout-group` | Wraps many `disclosure-ld-layouts` blocks at once. You can use this block to control when each should be displayed, allowing only one `disclosure-ld-layout` open at a time. |
| `disclosure-ld-trigger-group` | Wraps many `disclosure-ld-trigger` blocks at once. You can use this block to control when and how the `disclosure-ld-layouts` blocks declared inside the `disclosure-ld-layout-group` should be displayed. |

### Step 2 - Adding the Disclosure Linked Data Layout blocks to your theme templates

Copy one of the examples below and paste it into your desired theme template, changing as necessary. If needed, add the `disclosure-ld-layout` block to the block list of the template.

- Simple example:

```json
{
  "disclosure-ld-layout#simple": {
    "children": ["disclosure-ld-trigger#simple", "disclosure-ld-content#simple"]
  },
  "disclosure-ld-trigger#simple": {
    "children": ["rich-text#question"]
  },
  "disclosure-ld-content#simple": {
    "children": ["rich-text#answer"]
  },
  "rich-text#question": {
    "props": {
      "text": "How can I change my shipping address?"
    }
  },
  "rich-text#answer": {
    "props": {
      "text": "Call us at (212) 123-1234"
    }
  }
}
```

- Example using the `disclosure-ld-layout-group` block:

```json
{
  "disclosure-ld-layout-group#group": {
    "children": ["disclosure-ld-layout#first", "disclosure-ld-layout#second"]
  },

  "disclosure-ld-layout#first": {
    "children": ["disclosure-ld-trigger#first", "disclosure-ld-content#first"]
  },
  "disclosure-ld-trigger#first": {
    "children": ["rich-text#question1"]
  },
  "disclosure-ld-content#first": {
    "children": ["rich-text#answer1"]
  },
  "rich-text#question1": {
    "props": {
      "text": "How can I change my shipping address?"
    }
  },
  "rich-text#answer1": {
    "props": {
      "text": "Call us at (212) 123-1234."
    }
  },

  "disclosure-ld-layout#second": {
    "children": ["disclosure-ld-trigger#first", "disclosure-ld-content#first"]
  },
  "disclosure-ld-trigger#second": {
    "children": ["rich-text#question1"]
  },
  "disclosure-ld-content#second": {
    "children": ["rich-text#answer1"]
  },
  "rich-text#question2": {
    "props": {
      "text": "How can I track my order?"
    }
  },
  "rich-text#answer2": {
    "props": {
      "text": "After logging in to your account, you can find this information in the Orders link."
    }
  }
}
```

- Example using the `disclosure-ld-state-indicator` block:

```json
{
  "disclosure-ld-state-indicator": {
    "props": {
      "Show": "icon-angle--down",
      "Hide": "icon-angle--up"
    }
  }
}
```

#### `disclosure-ld-layout` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `initialVisibility` | `enum` | Defines the initial visibility of the layout content. Possible values are: `visible` (content initially open) or `hidden` (content is only displayed with user interaction). | `hidden` |
| `animated` | `boolean` | Defines if the layout content should have animations. When set as `true`, this prop will enable additional `data-\*` attributes on the content, which you can use as selectors in CSS. It will also ensure that the element will be hidden once the transition has ended. | `false` |
| `generateStructuredData` | `boolean` | When `true`, renders a [schema.org `FAQPage`](https://schema.org/FAQPage) JSON-LD script for this layout (question from `disclosure-ld-trigger`, answer from `disclosure-ld-content`). **Ignored** when nested in a `disclosure-ld-layout-group` that already has this prop enabled. See [Structured data (FAQPage)](#structured-data-faqpage). | `false` |

#### `disclosure-ld-trigger` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `Show` | `block` | Name of the block that will be rendered when prompted to show the content. | `undefined` |
| `Hide` | `block` | Name of the block that will be rendered when prompted to hide the content. | `undefined` |
| `as` | `string` | HTML tag to be applied to the component when rendered on the UI. | `button` |
| `children` | `block`  | Name of the block that will be rendered if no blocks are declared in the `Show` or `Hide` props. | `undefined` |
| `blockClass` | `string` | Block ID defined by you that will be used in [CSS customizations](https://developers.vtex.com/docs/guides/vtex-io-documentation-using-css-handles-for-store-customization#using-the-blockclass-property). | `undefined` |

#### `disclosure-ld-content` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `blockClass` | `string` | Block ID defined by you that will be used in [CSS customizations](https://developers.vtex.com/docs/guides/vtex-io-documentation-using-css-handles-for-store-customization#using-the-blockclass-property). | `undefined` |
| `children`   | `[block]` | List of blocks that will render the desired disclosure content. | `undefined` |

#### `disclosure-ld-state-indicator` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `Show` | `block` | Name of the block that will be rendered when prompted to show the content. | `undefined` |
| `Hide` | `block` | Name of the block that will be rendered when prompted to hide the content. | `undefined` |

#### `disclosure-ld-layout-group` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `maxVisible` | `enum` | Defines how many `disclosure-ld-layout` blocks should be displayed at a time. Possible values are: `one` (only one `disclosure-ld-layout` block should have its content displayed at time) or `many` (different `disclosure-ld-layout` block content can be displayed at time). | `one` |
| `generateStructuredData` | `boolean` | When `true`, aggregates every descendant `disclosure-ld-layout` (including through wrappers such as `flex-layout`) into a **single** [schema.org `FAQPage`](https://schema.org/FAQPage) JSON-LD script. **Prevails over** each child's own `generateStructuredData` prop. See [Structured data (FAQPage)](#structured-data-faqpage). | `false` |

#### `disclosure-ld-trigger-group` props

| Prop name | Type | Description | Default value |
| - | - | - | - |
| `Show` | `block`  | Name of the block that will be rendered when prompted to show the content. | `undefined` |
| `Hide` | `block`  | Name of the block that will be rendered when prompted to hide the content. | `undefined` |
| `as` | `string` | HTML tag to be applied to the component when rendered on the UI. | `button`      |
| `children` | `block`  | Name of the block that will be rendered if no blocks are declared in the `Show` or `Hide` props. | `undefined` |
| `blockClass` | `string` | Block ID defined by you that will be used in [CSS customizations](https://developers.vtex.com/docs/guides/vtex-io-documentation-using-css-handles-for-store-customization#using-the-blockclass-property). | `undefined` |

## Structured data (FAQPage)

`disclosure-ld-layout` can optionally generate [schema.org `FAQPage`](https://schema.org/FAQPage) JSON-LD (`disclosure-ld-trigger` = question, `disclosure-ld-content` = answer). The feature is opt-in (`generateStructuredData`, default `false`) and does not change visual behavior.

The `<script type="application/ld+json">` is injected via `Helmet` from `vtex.render-runtime` and is present in the SSR HTML. Text is taken from `rich-text` props/content inside trigger/content; if no text can be resolved, that item is omitted without affecting the UI. HTML and common Markdown markers are stripped from the extracted text.

### Isolated usage

When a `disclosure-ld-layout` is used on its own (not inside a `disclosure-ld-layout-group`), enabling `generateStructuredData` makes it render its own script, with a single question/answer in `mainEntity`:

```json
{
  "disclosure-ld-layout#simple": {
    "props": {
      "generateStructuredData": true
    },
    "children": ["disclosure-ld-trigger#simple", "disclosure-ld-content#simple"]
  },
  "disclosure-ld-trigger#simple": {
    "children": ["rich-text#question"]
  },
  "disclosure-ld-content#simple": {
    "children": ["rich-text#answer"]
  },
  "rich-text#question": {
    "props": {
      "text": "How can I change my shipping address?"
    }
  },
  "rich-text#answer": {
    "props": {
      "text": "Call us at (212) 123-1234."
    }
  }
}
```

Generated JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I change my shipping address?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Call us at (212) 123-1234."
      }
    }
  ]
}
```

### Usage inside a `disclosure-ld-layout-group`

When enabled on a `disclosure-ld-layout-group`, the group aggregates every `disclosure-ld-layout` descendant into a **single** script — the individual `disclosure-ld-layout` blocks don't render (and don't need) their own `generateStructuredData` prop:

```json
{
  "disclosure-ld-layout-group#group": {
    "props": {
      "generateStructuredData": true
    },
    "children": ["disclosure-ld-layout#first", "disclosure-ld-layout#second"]
  },

  "disclosure-ld-layout#first": {
    "children": ["disclosure-ld-trigger#first", "disclosure-ld-content#first"]
  },
  "disclosure-ld-trigger#first": {
    "children": ["rich-text#question1"]
  },
  "disclosure-ld-content#first": {
    "children": ["rich-text#answer1"]
  },
  "rich-text#question1": {
    "props": {
      "text": "How can I change my shipping address?"
    }
  },
  "rich-text#answer1": {
    "props": {
      "text": "Call us at (212) 123-1234."
    }
  },

  "disclosure-ld-layout#second": {
    "children": ["disclosure-ld-trigger#second", "disclosure-ld-content#second"]
  },
  "disclosure-ld-trigger#second": {
    "children": ["rich-text#question2"]
  },
  "disclosure-ld-content#second": {
    "children": ["rich-text#answer2"]
  },
  "rich-text#question2": {
    "props": {
      "text": "How can I track my order?"
    }
  },
  "rich-text#answer2": {
    "props": {
      "text": "After logging in to your account, you can find this information in the Orders link."
    }
  }
}
```

Generated JSON-LD (a single script, rendered by `disclosure-ld-layout-group#group`):

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I change my shipping address?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Call us at (212) 123-1234."
      }
    },
    {
      "@type": "Question",
      "name": "How can I track my order?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "After logging in to your account, you can find this information in the Orders link."
      }
    }
  ]
}
```

> ⚠️ **Precedence:** with `generateStructuredData: true` on the group, setting the same prop on individual `disclosure-ld-layout` children has **no additional effect**. The individual prop only matters when the layout is isolated (or inside a group that does not enable the feature).

## Customization

To apply CSS customizations in this and other blocks, follow the instructions given in the recipe on [Using CSS handles for store customization](https://developers.vtex.com/docs/guides/vtex-io-documentation-using-css-handles-for-store-customization).

| CSS handles             |
| ----------------------- |
| `content`               |
| `content--visible`      |
| `content--hidden`       |
| `trigger`               |
| `trigger--visible`      |
| `trigger--hidden`       |
| `triggerGroup`          |
| `triggerGroup--visible` |
| `triggerGroup--hidden`  |

<!-- DOCS-IGNORE:start -->

## Contributors ✨

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

<!-- DOCS-IGNORE:end -->
