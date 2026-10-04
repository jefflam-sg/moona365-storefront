"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AccountData = {
  customer: { name: string; email: string };
  orders: Array<{
    id: string;
    invoiceNumber: number;
    businessDate: string;
    total: string;
    currency: string;
    status: string;
  }>;
};

export default function CustomerAccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [message, setMessage] = useState("Loading your account…");
  useEffect(() => {
    void fetch("/api/account/session", { cache: "no-store" })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) {
          router.replace("/account/login");
          return;
        }
        setData(value);
        setMessage("");
      })
      .catch(() => setMessage("Your account could not be loaded."));
  }, [router]);
  const logout = async () => {
    await fetch("/api/account/session", { method: "DELETE" });
    router.replace("/");
  };
  return (
    <main className="sf-width sf-customer-account">
      <header>
        <div>
          <span className="sf-eyebrow">YOUR ACCOUNT</span>
          <h1>
            {data ? `Welcome, ${data.customer.name}` : "Customer account"}
          </h1>
          {data && <p>{data.customer.email}</p>}
        </div>
        {data && (
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        )}
      </header>
      {message && <p role="status">{message}</p>}
      {data && (
        <section>
          <h2>Website orders</h2>
          {data.orders.length === 0 ? (
            <p>No website orders yet.</p>
          ) : (
            <div className="sf-account-orders">
              {data.orders.map((order) => (
                <article key={order.id}>
                  <span>
                    <strong>Order {order.invoiceNumber}</strong>
                    <small>{order.businessDate}</small>
                  </span>
                  <span>
                    <strong>
                      {new Intl.NumberFormat("en-SG", {
                        style: "currency",
                        currency: order.currency,
                      }).format(Number(order.total))}
                    </strong>
                    <small>{order.status}</small>
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
