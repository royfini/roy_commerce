import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

export default function Purshase() {
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState([]);
  const { id } = useParams();
  let socket = useRef(null);
  useEffect(() => {
    // Fetch the user ID
    const fetchUserId = async () => {
      try {
        const response = await fetch("http://localhost:3000/user", {
          credentials: "include",
        });
        const response1 = await fetch(
          `http://localhost:3000/purchase/get-all-product/${id}`,
          {
            credentials: "include",
          }
        );
        const products = await response1.json();
        const data = await response.json();
        let userId = data.id;
        setProducts(products);
        // Initialize socket connection
        socket.current = io("http://localhost:3000");
        socket.current.on("connect", () => {
          console.log("Connected to server");
          // Join the room based on user ID
          console.log(`private-room-${userId}`);
          socket.current.emit("joinPrivateRoom", `private-room-${userId}`);
        });
        socket.current.on("productAddedToPurshase", (data) => {
          setProducts(data);
        });
        socket.current.on("productPlusToPurshase", (data) => {
          setProducts(data);
        });
        socket.current.on("productRemoveFromPurshase", (data) => {
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
  }, [id]);

  const handleAddClick = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/purchase/add-product/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: productId }),
        credentials: "include", // Include credentials to allow cookies
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handlePlusClick = async (e, Idproduct) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/purchase/add-product-qty/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId:  Idproduct}),
        credentials: "include", // Include credentials to allow cookies
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleMinusClick = async (e, Idproduct) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/purchase/remove-product-qty/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId:  Idproduct}),
        credentials: "include", // Include credentials to allow cookies
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/purchase/save/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials to allow cookies
      });
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
            <button onClick={(e)=>handleMinusClick(e,product.product.id)}>-</button>
            <button onClick={(e)=>handlePlusClick(e,product.product.id)}>+</button>
          </li>
        ))}
      </ul>
      <button onClick={handleSaveClick}>Save</button>
    </div>
  );
}
