/**
 * Extra `data-*` attributes a page puts on a block or an item, e.g. its page-agent target
 * (`data-agent-id`). The components spread them on the element as they are.
 */
export type DataAttributes = Record<`data-${string}`, string | undefined>;
