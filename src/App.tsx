import { RouterProvider, useRouter } from './lib/router';
import { StoreProvider } from './lib/cart-context';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { SessionsPage } from './pages/SessionsPage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderThankYouPage } from './pages/OrderThankYouPage';
import { AboutPage } from './pages/AboutPage';
import { ShippingPage } from './pages/ShippingPage';
import { FaqPage } from './pages/FaqPage';
import { AdminPage } from './pages/AdminPage';

function AppRoutes() {
  const { pathname } = useRouter();
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/') return <HomePage />;
  if (cleanPath === '/sessions' || cleanPath === '/shop') return <SessionsPage />;
  if (cleanPath === '/shop/adult') return <ShopPage initialLine="adult" />;
  if (cleanPath === '/shop/kiddies') return <ShopPage initialLine="kiddies" />;
  if (cleanPath === '/shop/combo') return <ShopPage initialLine="combo" />;
  if (cleanPath.startsWith('/product/')) {
    const slug = decodeURIComponent(cleanPath.slice('/product/'.length));
    return <ProductPage slug={slug} />;
  }
  if (cleanPath === '/cart') return <CartPage />;
  if (cleanPath === '/checkout') return <CheckoutPage />;
  if (cleanPath.startsWith('/order/')) {
    const orderNumber = decodeURIComponent(cleanPath.slice('/order/'.length));
    return <OrderThankYouPage orderNumber={orderNumber} />;
  }
  if (cleanPath === '/about') return <AboutPage />;
  if (cleanPath === '/shipping') return <ShippingPage />;
  if (cleanPath === '/faq') return <FaqPage />;
  if (cleanPath === '/admin') return <AdminPage />;

  return <HomePage />;
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <div className="min-h-screen flex flex-col bg-[#F3EBDF] text-[#1C1410] dark:bg-[#14100D] dark:text-[#F3EBDF]">
          <Header />
          <main className="flex-1">
            <AppRoutes />
          </main>
          <Footer />
          <CartDrawer />
        </div>
      </StoreProvider>
    </RouterProvider>
  );
}
