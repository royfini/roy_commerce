import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Purshase() {
  const [id, setId] = useState("");
  const [products, setProducts] = useState([]);

  let socket = useRef(null);
  useEffect(() => {
    socket.current = io("http://localhost:3000");
    socket.current.on("connection", () => {
      console.log("Connected to server");
    });
    socket.current.on("productAddedTopurshase", (data) => {
      console.log(data);
      setProducts(data);
    });
    // Cleanup function to remove event listeners
    return () => {
      socket.current.off("connect");
      socket.current.off("productAddedTopurshase");
      socket.current.disconnect();
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
          body: JSON.stringify({ productId: id }),
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
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="Enter ID"
      />
      <button onClick={handleAddClick}>Add</button>
      <ul>
        {products.map((product) => (
          <li key={product.product}>{product.product.name+ ' ' + product.quantity}</li>
        ))}
      </ul>
    </div>
  );
}
