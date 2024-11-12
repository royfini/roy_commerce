import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
export default function CreatePurchase() {
  const [purchases, setPurchases] = useState([]);
  let socket = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("http://localhost:3000/user", {
          credentials: "include",
        });
        const response1 = await fetch(
          "http://localhost:3000/purchase/get-all",
          {
            credentials: "include",
          }
        );
        const purchases = await response1.json();
        const data = await response.json();
        let userId = data.id;
        console.log(purchases)
        setPurchases(purchases);
        // Initialize socket connection
        socket.current = io("http://localhost:3000");
        socket.current.on("connect", () => {
          console.log("Connected to server");
          // Join the room based on user ID
          console.log(`private-room-${userId}`);
          socket.current.emit("joinPrivateRoom", `private-room-${userId}`);
        });
        socket.current.on("add_purchase", (data) => {
          setPurchases((prevPurchases) => [...prevPurchases, data]);
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

  const handleEditClick = (id) => {
    navigate(`/purchase/${id}`);
  };

  const handleCreateClick = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/purchase/create`, {
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
      <button onClick={handleCreateClick}>Create Purchase</button>
      <ul>
        {purchases.map((i) => (
          <li key={i.id}>
            {i.id}
            <button onClick={() => handleEditClick(i.id)}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
