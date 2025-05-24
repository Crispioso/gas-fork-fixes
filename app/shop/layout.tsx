// app/shop/layout.tsx
import React from 'react';

// You can define metadata specific to the shop section here if needed
// export const metadata = {
//   title: 'Shop - GAY RETRO TCG',
//   description: 'Browse our collection of retro trading cards.',
// };

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
        
    
      {/*
        If you wanted a specific layout for the shop section,
        e.g., a sidebar or a different header section just for shop pages,
        you would add it here.

        For example:
        <div style={{ display: 'flex' }}>
          <aside style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem' }}>
            Shop Filters / Categories
          </aside>
          <div style={{ flexGrow: 1, padding: '1rem' }}>
            {children} // This would be app/shop/page.tsx content
          </div>
        </div>
      */}

      {/* For a basic setup where shop pages just use the root layout's structure,
          you can often just pass the children through.
          If this file (app/shop/layout.tsx) exists, it *must* render {children}.
      */}
      {children}
  
    </>
    
  );
}
