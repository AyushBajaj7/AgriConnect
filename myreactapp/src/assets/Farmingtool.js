import React from "react";
import tractorImage from "../assets/Picture1.jpg";
import harvesterImage from "../assets/Picture2.jpg";
import powerTillerImage from "../assets/Picture3.jpg";
import rotaryTillerImage from "../assets/Picture4.jpg";
import seedDrillImage from "../assets/Picture5.jpg";
import dripIrrigationImage from "../assets/Picture6.jpg";
import sprayerImage from "../assets/Picture7.jpg";
import "../Farmingtool.css"; // Make sure to import your CSS file

const toolImages = {
  tractor: tractorImage,
  harvester: harvesterImage,
  powerTiller: powerTillerImage,
  rotaryTiller: rotaryTillerImage,
  seedDrill: seedDrillImage,
  dripIrrigation: dripIrrigationImage,
  sprayer: sprayerImage,
};

const toolsData = [
  {
    id: "tractor",
    name: "Tractor",
    useCase:
      "Essential for plowing, hauling, and planting on farms of all sizes. It is the backbone of modern Indian farming.",
    price: "₹2.5 to ₹9 lakhs depending on horsepower and brand.",
    image: toolImages.tractor,
  },
  {
    id: "harvester",
    name: "Combined Harvester",
    useCase:
      "Harvests crops like rice and wheat by cutting, threshing, and separating grains in one process, reducing time and post-harvest losses.",
    price: "₹15 to ₹25 lakhs based on capacity and technology.",
    image: toolImages.harvester,
  },
  {
    id: "powerTiller",
    name: "Power Tiller",
    useCase:
      "Used for soil preparation, especially by small and marginal farmers. It is compact, combining the functions of a plow and a small tractor.",
    price: "₹1 to ₹2.5 lakhs.",
    image: toolImages.powerTiller,
  },
  {
    id: "rotaryTiller",
    name: "Rotary Tiller",
    useCase:
      "Used to break up soil, making it easier to plant seeds. It also incorporates organic matter into the soil, improving its quality.",
    price: "₹60,000 to ₹1.5 lakhs.",
    image: toolImages.rotaryTiller,
  },
  {
    id: "seedDrill",
    name: "Seed Drill/Planter",
    useCase:
      "Ensures precise seed spacing and placement, optimizing crop yield by reducing seed wastage.",
    price: "₹80,000 to ₹3 lakhs.",
    image: toolImages.seedDrill,
  },
  {
    id: "dripIrrigation",
    name: "Drip Irrigation System",
    useCase:
      "Conserves water by delivering it directly to the plant roots. Ideal for water-scarce regions and for growing cash crops like fruits and vegetables.",
    price: "₹50,000 to ₹2 lakhs for larger farms.",
    image: toolImages.dripIrrigation,
  },
  {
    id: "sprayer",
    name: "Sprayer (Pesticide/Fungicide)",
    useCase:
      "Used for applying pesticides and fungicides to crops to protect them from diseases and pests.",
    price: "₹10,000 to ₹1 lakh, depending on size and type.",
    image: toolImages.sprayer,
  },
];

const Farmingtool = () => {
  return (
    <div className="farming-tools-container">
      <h1>Farming Tools</h1>
      <p>
        Explore a variety of farming tools that can enhance your agricultural
        productivity:
      </p>

      <div className="tool-grid">
        {toolsData.map((tool) => (
          <div key={tool.id} className="tool-card">
            <img src={tool.image} alt={tool.name} className="tool-image" />
            <h3 className="tool-name">{tool.name}</h3>

            <div className="tool-hover-info">
              <h3>{tool.name}</h3>
              <p>
                <strong>Use Case:</strong> {tool.useCase}
              </p>
              <p>
                <strong>Price:</strong> {tool.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Farmingtool;
