"use client";

export function ListingSort({ value }: { value: string }) {
  return <label className="sf-plp-sort"><span>Sort by</span><select name="sort" value={value} onChange={(event) => event.currentTarget.form?.requestSubmit()}><option value="featured">Featured</option><option value="newest">Newest</option><option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select></label>;
}
