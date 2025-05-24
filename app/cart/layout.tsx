// app/cart/layout.tsx
import React from 'react';

// You can define metadata specific to the cart section here if needed
// export const metadata = {
//   title: 'Your Cart - GAY RETRO TCG',
//   description: 'Review items in your shopping cart.',
// };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        If you had a specific layout structure for the cart page,
        it would go here, wrapping the {children}.

        For example, you might want a container with a specific max-width
        or background just for the cart content area, though often this
        is handled in the page component itself or a shared page container style.

        <div className="cart-section-wrapper"> // Example class
           {children} // This would be app/cart/page.tsx content
        </div>
      */}

      {/* For a basic setup where the cart page uses the root layout's structure
          and specific styling is handled by app/cart/page.tsx and its CSS module,
          you can just render the children.
          If this file (app/cart/layout.tsx) exists, it *must* render {children}.
      */}
      {children}
    </>
  );
}