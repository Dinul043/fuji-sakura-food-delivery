'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  is_veg: boolean;
}

interface NewOrderNotification {
  type: string;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  payment_method: string;
  items_count: number;
  items: OrderItem[];
  timestamp: string;
  status: string;
}

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<NewOrderNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [latestOrder, setLatestOrder] = useState<NewOrderNotification | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get restaurant ID from localStorage
    const storedRestaurantId = localStorage.getItem('restaurantId');
    if (!storedRestaurantId) {
      alert('Please login as restaurant first');
      router.push('/restaurant-login');
      return;
    }
    
    setRestaurantId(parseInt(storedRestaurantId));
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;

    // Connect to WebSocket
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/restaurant-dashboard/${restaurantId}`);
      
      ws.onopen = () => {
        console.log('✅ Connected to restaurant notifications');
        setIsConnected(true);
        
        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        
        ws.addEventListener('close', () => clearInterval(heartbeat));
      };
      
      ws.onmessage = (event) => {
        // Ignore heartbeat pong responses
        if (typeof event.data === 'string' && event.data === 'pong') {
          return;
        }
        
        try {
          const message = JSON.parse(event.data);
          
          if (message.event === 'new_order') {
            handleNewOrder(message.data);
          }
        } catch (error) {
          // Silently ignore non-JSON messages (like pong)
          if (event.data !== 'pong') {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('🔌 Disconnected from notifications');
        setIsConnected(false);
        
        // Reconnect after 3 seconds
        setTimeout(() => {
          console.log('🔄 Reconnecting...');
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [restaurantId]);

  const handleNewOrder = (orderData: NewOrderNotification) => {
    console.log('🆕 New order received:', orderData);
    
    // Add to orders list
    setOrders(prev => [orderData, ...prev]);
    
    // Show notification banner
    setLatestOrder(orderData);
    setShowNotification(true);
    
    // Hide notification after 10 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* New Order Notification Banner */}
        {showNotification && latestOrder && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white rounded-lg shadow-2xl p-4 max-w-md animate-slide-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">🎉 New Order Received!</h3>
                <p className="text-sm">Order: {latestOrder.order_number}</p>
                <p className="text-sm">Customer: {latestOrder.customer_name}</p>
                <p className="text-sm font-semibold">Amount: ₹{latestOrder.total_amount}</p>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-white hover:text-gray-200 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Restaurant Dashboard</h1>
              <p className="text-gray-600 mt-1">Restaurant ID: {restaurantId}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            New Orders ({orders.length})
          </h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Waiting for new orders...</p>
              <p className="text-gray-400 mt-2">Orders will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{order.order_number}</h3>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <p className="text-gray-500 text-sm">{order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{order.total_amount}</p>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mt-2">
                        {order.payment_method === 'online' ? 'Paid Online' : 'COD'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Items ({order.items_count}):</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                          </div>
                          <span className="font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-1">Delivery Address:</h4>
                    <p className="text-gray-600">{order.delivery_address}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-sm text-gray-500 mb-4">
                    Received: {new Date(order.timestamp).toLocaleString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Accept Order
                    </button>
                    <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors">
                      Reject Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
