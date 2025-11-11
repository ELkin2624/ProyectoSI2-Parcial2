import { Search, ShoppingBag, CreditCard, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, type KeyboardEvent } from "react";
import { Link, useParams, useSearchParams, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { CustomLogo } from "@/components/custom/CustomLogo";
import { useAuthStore } from "@/auth/store/auth.store";
import { useCart } from "../hooks/useCart";


const Header = () => {


    const { data } = useCart();
    const cartCount = data?.items.length || 0;

    const { authStatus, isAdmin, logout } = useAuthStore();

    const [searchParams, setSearchParams] = useSearchParams();
    const { gender } = useParams();
    const location = useLocation();



    const query = searchParams.get('query') || '';

    const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {

        if (event.key !== 'Enter') return;

        const query = inputRef.current?.value;
        const newSearchParams = new URLSearchParams();

        if (!query) {
            newSearchParams.delete('query');
        } else {
            newSearchParams.set('query', inputRef.current!.value);
        }
        setSearchParams(newSearchParams);
    }


    const inputRef = useRef<HTMLInputElement>(null)

    return <header className="sticky top-0 z-50 w-full border-b backdrop-blur bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                {/* Logo */}
                <CustomLogo />

                {/* Navigation - Desktop */}
                <nav className="hidden md:flex items-center space-x-8">
                    <Link
                        to="/"
                        className={cn(`text-sm font-medium transition-colors hover:text-primary`,
                            location.pathname === '/' ? 'underline underline-offset-4' : ''
                        )}
                    >
                        Productos
                    </Link>

                    {/* Solo mostrar si está autenticado */}
                    {authStatus === 'authenticated' && (
                        <>
                            <Link
                                to="/my-addresses"
                                className={cn(`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1`,
                                    location.pathname === '/my-addresses' ? 'underline underline-offset-4' : ''
                                )}
                            >
                                <MapPin className="h-4 w-4" />
                                Mis Direcciones
                            </Link>
                            <Link
                                to="/my-payments"
                                className={cn(`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1`,
                                    location.pathname === '/my-payments' ? 'underline underline-offset-4' : ''
                                )}
                            >
                                <CreditCard className="h-4 w-4" />
                                Mis Pagos
                            </Link>
                            <Link
                                to="/profile/settings"
                                className={cn(`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1`,
                                    location.pathname === '/profile/settings' ? 'underline underline-offset-4' : ''
                                )}
                            >
                                <Settings className="h-4 w-4" />
                                Mi Cuenta
                            </Link>
                        </>
                    )}
                </nav>

                {/* Search and Cart */}
                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder={query}
                                className="pl-9 w-64 h-9 bg-white"
                                onKeyDown={handleSearch}

                            />

                        </div>
                    </div>

                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Search className="h-5 w-5" />
                    </Button>


                    {
                        authStatus === 'not-authenticated' ? (
                            <Link to={'/auth/login'}>
                                <Button
                                    variant='default'
                                    size='sm'
                                    className="ml-3"
                                >
                                    Login
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                variant='outline'
                                size='sm'
                                className="ml-3"
                                onClick={logout}
                            >
                                Cerrar sesion
                            </Button>
                        )
                    }

                    {
                        isAdmin() &&
                        (<Link to={'/admin'}>
                            <Button
                                variant='destructive'
                                size='sm'

                            >
                                Admin
                            </Button>
                        </Link>)
                    }

                    {/* Button cart */}
                    <Link to={'/cart'}>
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {cartCount}
                            </span>}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    </header>;
};
export default Header;