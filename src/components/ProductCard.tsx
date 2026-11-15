import { useState } from 'react';
import { formatNgn, getLineLabel } from '../lib/catalog';
import { useStore } from '../lib/cart-context';
import { resolveProductImage } from '../lib/product-images';
import { Link } from '../lib/router';
import type { Product } from '../lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useStore();
  const [imgError, setImgError] = useState(false);
  const primaryVariant = product.variants[0];
  const imageSrc = resolveProductImage(product);

  return (
    <article className="group flex flex-col rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        to={`/product/${product.slug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#EAE0D2]/70 dark:bg-[#261F1A] block"
      >
        {!imgError && imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EAE0D2] to-[#DCD0BF] dark:from-[#261F1A] dark:to-[#1C1410] p-6 text-center">
            <span className="font-display text-xl text-[#1C1410] dark:text-[#F3EBDF]">
              {product.name}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5 gap-4">
        <div className="space-y-1.5">
          {/* Zero-pill metadata */}
          <div className="flex items-center gap-2 text-xs text-[#5C4E45] dark:text-[#B8AA9B]">
            <span>{getLineLabel(product.line)}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{primaryVariant.sizeLabel}</span>
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="block font-display text-xl font-semibold leading-snug text-[#1C1410] dark:text-[#F3EBDF] group-hover:text-[#B85C38] transition-colors"
          >
            {product.name}
          </Link>

          <p className="text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B] line-clamp-2">
            {product.shortNote}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
          <span className="font-mono-num text-[15px] font-medium text-[#1C1410] dark:text-[#F3EBDF]">
            {formatNgn(primaryVariant.priceNgn)}
          </span>

          <button
            type="button"
            onClick={() => addItem(product.id, primaryVariant.id, 1)}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg bg-[#1C1410] text-[#F3EBDF] hover:bg-[#B85C38] dark:bg-[#F3EBDF] dark:text-[#1C1410] dark:hover:bg-[#C6A36A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </article>
  );
}
