import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://api-virtual-try-on.vercel.app"; // Backend na Vercel

const App = () => {
  const [humanImage, setHumanImage] = useState(null);
  const [clothImage, setClothImage] = useState(null);
  const [humanPreview, setHumanPreview] = useState(null);
  const [clothPreview, setClothPreview] = useState(null);
  const [taskId, setTaskId] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [loading, setLoading] = useState(false);

  // 📸 Converter imagem para Base64 e mostrar preview
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Image = reader.result.split(",")[1]; // Remove o prefixo 'data:image/png;base64,'

        if (type === "human") {
          setHumanImage(base64Image);
          setHumanPreview(reader.result); // Para mostrar preview
        } else {
          setClothImage(base64Image);
          setClothPreview(reader.result); // Para mostrar preview
        }
      };
    }
  };

  // 🔥 Criar Tarefa na API Kling AI (via backend Vercel)
  const createTask = async () => {
    if (!humanImage || !clothImage) {
      alert("Envie as duas imagens!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/try-on`, {
        model_name: "kolors-virtual-try-on-v1-5",
        human_image: humanImage,
        cloth_image: clothImage,
      });

      if (response.data.data.task_id) {
        setTaskId(response.data.data.task_id);
        checkTask(response.data.data.task_id);
      }
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Erro ao criar tarefa. Tente novamente.");
      setLoading(false);
    }
  };

  // 🔄 Monitorar Tarefa
  const checkTask = async (taskId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/try-on/${taskId}`);

        if (response.data.data.task_status === "succeed") {
          clearInterval(interval);
          setResultImage(response.data.data.task_result.images[0].url);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao buscar status:", error);
        clearInterval(interval);
        alert("Erro ao buscar status da tarefa.");
        setLoading(false);
      }
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold">Virtual Try-On</h1>
      <p className="text-lg mt-2">Faça upload da sua foto e de uma roupa!</p>

      <div className="mt-6 flex flex-col items-center gap-4">
        {/* Upload da Foto */}
        <label className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer">
          📷 Enviar Foto
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "human")} className="hidden" />
        </label>

        {humanPreview && (
          <img src={humanPreview} alt="Preview da Foto" className="mt-2 w-32 h-32 object-cover rounded-lg shadow-md" />
        )}

        {/* Upload da Roupa */}
        <label className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer">
          👕 Enviar Roupa
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "cloth")} className="hidden" />
        </label>

        {clothPreview && (
          <img src={clothPreview} alt="Preview da Roupa" className="mt-2 w-32 h-32 object-cover rounded-lg shadow-md" />
        )}
      </div>

      {/* Botão para processar */}
      <button
        onClick={createTask}
        className={`mt-6 px-6 py-2 rounded-lg text-white ${
          loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Processando..." : "Testar Roupa"}
      </button>

      {loading && <p className="mt-4 text-yellow-400">Gerando imagem, aguarde...</p>}

      {/* Exibir resultado */}
      {resultImage && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold">Resultado:</h2>
          <img src={resultImage} alt="Try-On Result" className="mt-4 rounded-lg shadow-lg w-64 h-auto" />
        </div>
      )}
    </div>
  );
};

export default App;
