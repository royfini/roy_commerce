import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Purshase() {
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState([]);

  let socket = useRef(null);
  useEffect(() => {
    // Fetch the user ID
    const fetchUserId = async () => {
      try {
        const response = await fetch("http://localhost:3000/user",{credentials: "include"});
        const data = await response.json();
        let id = data.id;
        // Initialize socket connection
        socket.current = io("http://localhost:3000");
        socket.current.on("connect", () => {
          console.log("Connected to server");
          // Join the room based on user ID
          console.log(`private-room-${id}`);
          socket.current.emit("joinPrivateRoom", `private-room-${id}`);
        });
        socket.current.on("productAddedToPurshase", (data) => {
          console.log(data);
          setProducts(data);
        });
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };

    fetchUserId();
    // Cleanup function to remove event listeners
    return () => {
      if (socket.current) {
        socket.current.off("connect");
        socket.current.off("productAddedTopurshase");
        socket.current.disconnect();
      }
    };
  }, []);

  const handleAddClick = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        "http://localhost:3000/purchase/add-product/67234725c131fbaa2a65e4e6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: productId }),
          credentials: "include", // Include credentials to allow cookies
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        placeholder="Enter ID"
      />
      <button onClick={handleAddClick}>Add</button>
      <ul>
        {products.map((product) => (
          <li key={product.product}>
            {product.product.name + " " + product.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}
