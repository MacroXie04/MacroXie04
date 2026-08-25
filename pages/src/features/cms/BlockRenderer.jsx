import { memo } from 'react';
import { HeroBlock } from './blocks/HeroBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { ImageTextBlock } from './blocks/ImageTextBlock';
import { LinkListBlock } from './blocks/LinkListBlock';
import { FaqListBlock } from './blocks/FaqListBlock';
import { TableBlock } from './blocks/TableBlock';

const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  rich_text: RichTextBlock,
  image_text: ImageTextBlock,
  link_list: LinkListBlock,
  faq_list: FaqListBlock,
  table: TableBlock,
};

export const BlockRenderer = memo(function BlockRenderer({ blocks }) {
  return (
    <>
      {(blocks || []).filter(Boolean).map((block) => {
        const Component = BLOCK_COMPONENTS[block.block_type];
        if (!Component) {
          return null;
        }
        return (
          <Component key={`${block.block_type}-${block.sort_order}`} data={block.data} />
        );
      })}
    </>
  );
});
