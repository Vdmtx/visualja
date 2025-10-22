
import React, { useState, useCallback } from 'react';
import { UserInput, GeneratedContent, Step } from './types';
import { generateText, generateImage, generateJson } from './services/geminiService';
import { LANGUAGES } from './constants';
import LoadingSpinner from './components/LoadingSpinner';
import GeneratedContentDisplay from './components/GeneratedContentDisplay';
import StepIndicator from './components/StepIndicator';
import { Type } from "@google/genai";
import JSZip from 'jszip';


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Introduction);
  const [userInput, setUserInput] = useState<UserInput>({
    companyName: '',
    location: '',
    sourceLanguage: LANGUAGES[0].code,
    targetLanguage: LANGUAGES[1].code,
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };
  
  const restartProcess = () => {
    setCurrentStep(Step.Introduction);
    setUserInput({ companyName: '', location: '', sourceLanguage: LANGUAGES[0].code, targetLanguage: LANGUAGES[1].code });
    setGeneratedContent({});
    setError(null);
  };
  
  const handleDownload = async () => {
    if (!generatedContent.mediaPlan || !generatedContent.marketStrategy || !generatedContent.logos || !generatedContent.banners) {
      setError("Conteúdo não está completamente gerado para download.");
      return;
    }
    setIsZipping(true);
    setError(null);
    try {
      const zip = new JSZip();
      
      const textFolder = zip.folder("estrategia_e_planos");
      
      if(textFolder){
          textFolder.file(`plano_de_midia_${userInput.targetLanguage}.txt`, generatedContent.mediaPlan.target);
          textFolder.file(`plano_de_midia_conferencia_${userInput.sourceLanguage}.txt`, generatedContent.mediaPlan.source);
          textFolder.file(`estrategia_de_mercado_${userInput.targetLanguage}.txt`, generatedContent.marketStrategy.target);
          textFolder.file(`estrategia_de_mercado_conferencia_${userInput.sourceLanguage}.txt`, generatedContent.marketStrategy.source);
      }

      const imageFolder = zip.folder("recursos_visuais");
      
      if(imageFolder){
          const logosFolder = imageFolder.folder("logomarcas");
          const bannersFolder = imageFolder.folder("banners");

          const base64ToBlob = async (base64: string): Promise<Blob> => {
              const res = await fetch(base64);
              return res.blob();
          };

          if (logosFolder) {
              for (let i = 0; i < generatedContent.logos.length; i++) {
                  const logoBlob = await base64ToBlob(generatedContent.logos[i]);
                  logosFolder.file(`logomarca_conceito_${i + 1}.jpeg`, logoBlob);
              }
          }
          
          if(bannersFolder) {
              const bannerNames = ["banner_1x1_quadrado", "banner_9x16_vertical", "banner_4x3_horizontal"];
              for (let i = 0; i < generatedContent.banners.length; i++) {
                  const bannerBlob = await base64ToBlob(generatedContent.banners[i]);
                  bannersFolder.file(`${bannerNames[i]}.jpeg`, bannerBlob);
              }
          }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${userInput.companyName.replace(/\s+/g, '_')}_campanha_visual_ja.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar o arquivo ZIP.');
    } finally {
      setIsZipping(false);
    }
  };


  const handleNextStep = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sourceLanguageName = LANGUAGES.find(l => l.code === userInput.sourceLanguage)?.name || userInput.sourceLanguage;

      switch (currentStep) {
        case Step.Introduction:
          setCurrentStep(Step.ProjectSetup);
          break;
        case Step.ProjectSetup:
          const mediaPlanPrompt = `Realize uma pesquisa e apresente um plano de mídia inicial para a empresa "${userInput.companyName}".
- Analise o nicho de mercado.
- Descreva o público-alvo principal (demographics, interesses, comportamentos online).
- Liste os principais canais de mídia que este público consome, com foco em plataformas populares em ${userInput.location}.
- Identifique 3 tendências atuais do setor.
- Sugira 3 tipos de conteúdo que teriam bom desempenho.
Apresente tudo de forma clara e estratégica, no idioma "${userInput.targetLanguage}".`;
          const mediaPlanTarget = await generateText(mediaPlanPrompt);
          const mediaPlanSource = await generateText(`Traduza o seguinte texto para ${sourceLanguageName}:\n\n${mediaPlanTarget}`);
          setGeneratedContent(prev => ({ ...prev, mediaPlan: { target: mediaPlanTarget, source: mediaPlanSource } }));
          setCurrentStep(Step.MediaPlan);
          break;
        case Step.MediaPlan:
           const strategyPrompt = `Crie uma estratégia de mercado completa para a empresa "${userInput.companyName}" com base nestas informações:
- Localização: ${userInput.location}
- Plano de Mídia: ${generatedContent.mediaPlan?.source}
A estratégia deve incluir:
- Matriz SWOT (Forças, Fraquezas, Oportunidades, Ameaças).
- Pesquisa de Concorrência: Liste 3 principais concorrentes em "${userInput.location}", analisando pontos fortes e fracos de cada um.
- Proposta de Valor Única (USP): Defina claramente o que a empresa oferece de único.
- Estratégia de Tráfego Pago: Sugira plataformas e abordagens.
- Estimativa de Orçamento Inicial Mensal (adicione um aviso claro de que são valores estimados).
Apresente a estratégia no idioma "${userInput.targetLanguage}".`;
            const marketStrategyTarget = await generateText(strategyPrompt);
            const marketStrategySource = await generateText(`Traduza o seguinte texto para ${sourceLanguageName}:\n\n${marketStrategyTarget}`);
            const usp = await generateText(`Extraia a Proposta de Valor Única (USP) do seguinte texto e retorne APENAS a USP em uma frase curta:\n\n${marketStrategySource}`);
            
            const adjectivesSchema = {
                type: Type.OBJECT,
                properties: {
                    adj1: { type: Type.STRING },
                    adj2: { type: Type.STRING },
                }
            };
            const adjectives = await generateJson(`Com base na estratégia: "${marketStrategySource}", forneça dois adjetivos contrastantes para uma marca (ex: 'confiança', 'ousadia').`, adjectivesSchema);
            const scene = await generateText(`Com base na USP: "${usp}", descreva uma cena visual simples para um anúncio. Seja conciso. Exemplo: 'Uma pessoa sorrindo enquanto usa um produto em um ambiente moderno e iluminado.'`);

            setGeneratedContent(prev => ({ ...prev, marketStrategy: { target: marketStrategyTarget, source: marketStrategySource, usp, adjectives, scene } }));
            setCurrentStep(Step.MarketStrategy);
            break;
        case Step.MarketStrategy:
            const { adj1, adj2 } = generatedContent.marketStrategy?.adjectives || { adj1: 'confiança e inovação', adj2: 'dinamismo e criatividade' };
            
            const logoPrompt1 = `Crie um ícone de logo minimalista e moderno para a empresa "${userInput.companyName}". O estilo deve transmitir ${adj1}. Gere uma paleta de cores harmoniosa e profissional adequada para a marca. O ícone deve ser limpo, em estilo vetorial, centralizado em um fundo branco liso, em proporção 1:1. --- COMANDOS NEGATIVOS: NÃO inclua texto, letras ou palavras. EVITE formas bizarras, distorcidas ou excessivamente complexas. NÃO use tipografia. NÃO use idiomas que não sejam o idioma de destino (${userInput.targetLanguage}).`;
            
            const logoPrompt2 = `Crie um ícone de logo ousado e criativo para a empresa "${userInput.companyName}". O estilo deve ser ${adj2}. Gere uma paleta de cores única e memorável. O design deve ser marcante, centralizado em um fundo branco liso, em proporção 1:1. --- COMANDOS NEGATIVOS: NÃO inclua texto, letras ou palavras. EVITE formas bizarras ou distorcidas. NÃO use tipografia. NÃO use idiomas que não sejam o idioma de destino (${userInput.targetLanguage}).`;

            const [logo1, logo2] = await Promise.all([generateImage(logoPrompt1), generateImage(logoPrompt2)]);
            setGeneratedContent(prev => ({ ...prev, logos: [logo1, logo2] }));
            setCurrentStep(Step.LogoCreation);
            break;
        case Step.LogoCreation:
             const sceneDesc = generatedContent.marketStrategy?.scene || `Uma cena que represente o principal benefício do produto/serviço da ${userInput.companyName}.`;
             
             const bannerPrompt1 = `Crie um banner publicitário no formato 1:1 (quadrado) para a "${userInput.companyName}". A cena deve ser: ${sceneDesc}. Use uma paleta de cores coesa e profissional, alinhada com a identidade da marca. Estilo fotográfico. Deixe um espaço limpo e proeminente para texto. --- COMANDOS NEGATIVOS: NÃO inclua NENHUM texto na imagem. EVITE formas distorcidas ou bizarras. NÃO use idiomas que não sejam o idioma de destino (${userInput.targetLanguage}).`;
             const bannerPrompt2 = `Crie um banner publicitário no formato 9:16 (vertical) para a "${userInput.companyName}". A cena deve ser: ${sceneDesc}. Use uma paleta de cores dinâmica e coesa, alinhada com a identidade da marca. Estilo dinâmico. Deixe um espaço limpo e proeminente para texto. --- COMANDOS NEGATIVOS: NÃO inclua NENHUM texto na imagem. EVITE formas distorcidas ou bizarras. NÃO use idiomas que não sejam o idioma de destino (${userInput.targetLanguage}).`;
             const bannerPrompt3 = `Crie um banner publicitário no formato 4:3 (horizontal) para a "${userInput.companyName}". A cena deve ser: ${sceneDesc}. Use uma paleta de cores profissional e coesa, alinhada com a identidade da marca. Estilo profissional. Deixe um espaço limpo e proeminente para texto. --- COMANDOS NEGATIVOS: NÃO inclua NENHUM texto na imagem. EVITE formas distorcidas ou bizarras. NÃO use idiomas que não sejam o idioma de destino (${userInput.targetLanguage}).`;

             const [banner1, banner2, banner3] = await Promise.all([
                 generateImage(bannerPrompt1),
                 generateImage(bannerPrompt2),
                 generateImage(bannerPrompt3)
             ]);
            setGeneratedContent(prev => ({ ...prev, banners: [banner1, banner2, banner3] }));
            setCurrentStep(Step.BannerCreation);
            break;
        case Step.BannerCreation:
            setCurrentStep(Step.Conclusion);
            break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>;

    switch (currentStep) {
      case Step.Introduction:
        return (
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-qwen-text-primary mb-2">Olá! Eu sou o Visual Já v2.0. 👋</h1>
            <p className="text-lg text-qwen-secondary mb-8">Vamos criar uma identidade visual incrível para o seu negócio.</p>
            <div className="space-y-4 max-w-lg mx-auto text-left">
              <label className="block">
                <span className="text-qwen-text-primary">Nome da Empresa:</span>
                <input type="text" name="companyName" value={userInput.companyName} onChange={handleInputChange} className="mt-1 block w-full bg-qwen-background/50 border-qwen-border rounded-md shadow-sm py-2 px-3 text-qwen-text-primary focus:outline-none focus:ring-qwen-primary focus:border-qwen-primary"/>
              </label>
              <label className="block">
                <span className="text-qwen-text-primary">Localização (Cidade - Estado - País):</span>
                <input type="text" name="location" value={userInput.location} onChange={handleInputChange} className="mt-1 block w-full bg-qwen-background/50 border-qwen-border rounded-md shadow-sm py-2 px-3 text-qwen-text-primary focus:outline-none focus:ring-qwen-primary focus:border-qwen-primary"/>
              </label>
              <label className="block">
                  <span className="text-qwen-text-primary">Idioma de Origem do Material (para conferência):</span>
                  <select name="sourceLanguage" value={userInput.sourceLanguage} onChange={handleInputChange} className="mt-1 block w-full bg-qwen-background/50 border-qwen-border rounded-md shadow-sm py-2 px-3 text-qwen-text-primary focus:outline-none focus:ring-qwen-primary focus:border-qwen-primary">
                      {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                  </select>
              </label>
              <label className="block">
                  <span className="text-qwen-text-primary">Idioma de Destino do Material:</span>
                   <select name="targetLanguage" value={userInput.targetLanguage} onChange={handleInputChange} className="mt-1 block w-full bg-qwen-background/50 border-qwen-border rounded-md shadow-sm py-2 px-3 text-qwen-text-primary focus:outline-none focus:ring-qwen-primary focus:border-qwen-primary">
                      {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                  </select>
              </label>
            </div>
          </div>
        );
      case Step.ProjectSetup:
        return (
            <div className="text-qwen-text-primary">
                <h2 className="text-3xl font-bold text-qwen-secondary mb-4">Configuração do Projeto</h2>
                <p className="mb-6">Com base nos dados da <span className="font-bold text-qwen-secondary">{userInput.companyName}</span>, localizada em <span className="font-bold text-qwen-secondary">{userInput.location}</span>, defini as configurações para este projeto:</p>
                <div className="bg-qwen-background/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-qwen-secondary mb-3">Idiomas</h3>
                    <p>O conteúdo será gerado em <span className="font-bold">{LANGUAGES.find(l => l.code === userInput.targetLanguage)?.name}</span>, com uma versão para conferência em <span className="font-bold">{LANGUAGES.find(l => l.code === userInput.sourceLanguage)?.name}</span>.</p>
                    <h3 className="text-xl font-semibold text-qwen-secondary mt-6 mb-3">Identidade Visual</h3>
                    <p>A identidade visual, incluindo paleta de cores, será gerada dinamicamente nos próximos passos para se alinhar perfeitamente com a estratégia de mercado da sua marca.</p>
                </div>
            </div>
        );
      case Step.MediaPlan:
        return generatedContent.mediaPlan && (
          <GeneratedContentDisplay
            title="Passo 1: Plano de Mídia"
            targetLanguageContent={generatedContent.mediaPlan.target}
            conferenceContent={generatedContent.mediaPlan.source}
            conferenceLanguageName={LANGUAGES.find(l => l.code === userInput.sourceLanguage)?.name || userInput.sourceLanguage}
          />
        );
      case Step.MarketStrategy:
        return generatedContent.marketStrategy && (
          <GeneratedContentDisplay
            title="Passo 2: Estratégia de Mercado"
            targetLanguageContent={generatedContent.marketStrategy.target}
            conferenceContent={generatedContent.marketStrategy.source}
            conferenceLanguageName={LANGUAGES.find(l => l.code === userInput.sourceLanguage)?.name || userInput.sourceLanguage}
          />
        );
      case Step.LogoCreation:
        return (
            <div>
                <h2 className="text-3xl font-bold text-qwen-secondary mb-4">Passo 3: Criação da Logomarca</h2>
                <p className="text-qwen-text-secondary mb-6">Aqui estão dois conceitos de logomarca para a {userInput.companyName}.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {generatedContent.logos?.map((logoSrc, index) => (
                        <div key={index} className="bg-qwen-background/50 p-4 rounded-lg flex flex-col items-center">
                            <h3 className="text-xl font-semibold text-qwen-text-primary mb-4">Conceito {index + 1}</h3>
                            <img src={logoSrc} alt={`Conceito de logo ${index + 1}`} className="w-full h-auto object-contain rounded-md bg-white"/>
                        </div>
                    ))}
                </div>
            </div>
        );
      case Step.BannerCreation:
        return (
            <div>
                <h2 className="text-3xl font-bold text-qwen-secondary mb-4">Passo 4: Criação de Banners Publicitários</h2>
                <p className="text-qwen-text-secondary mb-6">Banners gerados com base na sua Proposta de Valor Única, prontos para receber texto.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                        <h3 className="text-xl font-semibold text-qwen-text-primary mb-2">1:1 (Quadrado)</h3>
                        <img src={generatedContent.banners?.[0]} alt="Banner 1:1" className="w-full h-auto object-cover rounded-lg"/>
                    </div>
                     <div className="flex flex-col items-center">
                        <h3 className="text-xl font-semibold text-qwen-text-primary mb-2">9:16 (Vertical)</h3>
                        <img src={generatedContent.banners?.[1]} alt="Banner 9:16" className="w-full h-auto object-cover rounded-lg"/>
                    </div>
                     <div className="flex flex-col items-center">
                        <h3 className="text-xl font-semibold text-qwen-text-primary mb-2">4:3 (Horizontal)</h3>
                        <img src={generatedContent.banners?.[2]} alt="Banner 4:3" className="w-full h-auto object-cover rounded-lg"/>
                    </div>
                </div>
            </div>
        );
      case Step.Conclusion:
        return (
            <div className="text-center text-qwen-text-primary">
                <h2 className="text-4xl font-bold text-qwen-secondary mb-4">Projeto "Visual Já v2.0" Concluído! 🎉</h2>
                <p className="text-lg text-qwen-text-secondary mb-6 max-w-3xl mx-auto">Parabéns! Agora você tem um material completo, com identidade visual e estratégias detalhadas. Lembre-se de adicionar textos nos banners e o nome da empresa nas logomarcas usando um editor de imagens.</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button onClick={handleDownload} disabled={isZipping} className="bg-qwen-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed">
                    {isZipping ? 'Compactando...' : 'Baixar Campanha (.zip)'}
                  </button>
                  <button onClick={restartProcess} className="bg-qwen-border text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105">
                      Criar Novo Projeto
                  </button>
                </div>
            </div>
        );
      default:
        return null;
    }
  };
  
  const isFormValid = userInput.companyName && userInput.location && userInput.targetLanguage && userInput.sourceLanguage;
  
  return (
    <div className="min-h-screen bg-qwen-background font-sans text-qwen-text-primary p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-12">
           <h1 className="text-2xl font-bold text-qwen-text-primary tracking-wider">VISUAL JÁ v2.0</h1>
           <p className="text-qwen-secondary">Assistente de Branding com IA</p>
        </header>

        {currentStep > Step.Introduction && currentStep < Step.Conclusion && (
            <div className="mb-12 flex justify-center pt-8">
              <StepIndicator currentStepIndex={currentStep - 2} />
            </div>
        )}

        <main className="bg-qwen-panel border border-qwen-border rounded-xl shadow-2xl p-6 sm:p-10 min-h-[30rem] flex flex-col justify-center">
          {renderContent()}
        </main>
        
        {currentStep < Step.Conclusion && (
          <footer className="mt-8 text-center">
            <button
              onClick={handleNextStep}
              disabled={isLoading || (currentStep === Step.Introduction && !isFormValid)}
              className="bg-qwen-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? 'Gerando...' : (currentStep === Step.Introduction ? 'Começar a Mágica!' : (currentStep === Step.BannerCreation ? 'Finalizar Projeto' : 'Próximo Passo'))}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;