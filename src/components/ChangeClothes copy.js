import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaCamera, FaTshirt, FaDownload } from "react-icons/fa";
import ClipLoader from "react-spinners/ClipLoader";

const API_BASE_URL = "https://api-virtual-try-on.vercel.app"; // Backend na Vercel

const ChangeClothes = () => {
  const [fotoBase64, setFotoBase64] = useState(null);
  const [roupaBase64, setRoupaBase64] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [roupaPreview, setRoupaPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // 📸 Verificar restrições de imagem
  const validarImagem = (file) => {
    const tamanhoMaximo = 50 * 1024 * 1024; // 50MB
    const formatosPermitidos = ["image/jpeg", "image/png"];

    if (!formatosPermitidos.includes(file.type)) {
      alert("Formato inválido! Apenas JPG e PNG são suportados.");
      return false;
    }

    if (file.size > tamanhoMaximo) {
      alert("Arquivo muito grande! O limite é 50MB.");
      return false;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (img.width < 512 || img.height < 512 || img.width > 4096 || img.height > 4096) {
          alert("Resolução inválida! A largura mínima é 512px e a máxima é 4096px.");
          resolve(false);
        } else {
          resolve(true);
        }
      };
    });
  };

  // 📸 Converter imagem para Base64
  const handleFileChange = async (e, tipo) => {
    const file = e.target.files[0];
    if (file && (await validarImagem(file))) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        if (tipo === "foto") {
          setFotoBase64(base64);
          setFotoPreview(reader.result);
        } else {
          setRoupaBase64(base64);
          setRoupaPreview(reader.result);
        }
      };
    }
  };

  // 🔥 Enviar imagens para API
  const testarRoupa = async () => {
    if (!fotoBase64 || !roupaBase64) {
      alert("Por favor, envie sua foto e a roupa antes de continuar!");
      return;
    }
    setCarregando(true);
    setResultado(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/try-on`, {
        model_name: "kolors-virtual-try-on-v1-5",
        human_image: fotoBase64,
        cloth_image: roupaBase64,
      });
      if (response.data.data.task_id) {
        monitorarTarefa(response.data.data.task_id);
      }
    } catch (error) {
      console.error("Erro ao processar:", error);
      alert("Erro ao processar. Tente novamente!");
      setCarregando(false);
    }
  };

  // 🔄 Monitorar Status da Tarefa
  const monitorarTarefa = async (taskId) => {
    const intervalo = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/try-on/${taskId}`);
        if (response.data.data.task_status === "succeed") {
          clearInterval(intervalo);
          setResultado(response.data.data.task_result.images[0].url);
          setCarregando(false);
        }
      } catch (error) {
        console.error("Erro ao buscar status:", error);
        clearInterval(intervalo);
        alert("Erro ao buscar o status da tarefa!");
        setCarregando(false);
      }
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <motion.h1 className="text-4xl font-bold" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        Change Clothes
      </motion.h1>
      <p className="text-lg mt-2">Experimente roupas virtualmente!</p>

      {/* Uploads */}
      <div className="mt-6 flex flex-row gap-6 items-center">
        <div className="flex flex-col items-center">
          <label className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2">
            <FaCamera /> Enviar Sua Foto
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "foto")} className="hidden" />
          </label>
          {fotoPreview && <img src={fotoPreview} alt="Sua Foto" className="mt-2 w-40 h-40 object-cover rounded-lg shadow-md" />}
        </div>

        <h1 className="text-3xl font-bold">+</h1>

        <div className="flex flex-col items-center">
          <label className="bg-gray-700 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2">
            <FaTshirt /> Enviar Roupa
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "roupa")} className="hidden" />
          </label>
          {roupaPreview && <img src={roupaPreview} alt="Roupa" className="mt-2 w-40 h-40 object-cover rounded-lg shadow-md" />}
        </div>
      </div>

      <button onClick={testarRoupa} className={`mt-6 px-6 py-2 rounded-lg text-white transition-transform transform ${carregando ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700 active:scale-95"}`} disabled={carregando}>
        {carregando ? "Processando..." : "Testar Roupa"}
      </button>

      {carregando && <div className="mt-4"><ClipLoader color="#ffffff" size={35} /></div>}
    </div>
  );
};

export default ChangeClothes;
