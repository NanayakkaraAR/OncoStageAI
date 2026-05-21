import { Request, Response } from 'express';

// Comprehensive knowledge base for cancer-related questions
const knowledgeBase: { [key: string]: string } = {
  'lung cancer': 'Lung cancer is a disease in which malignant cells form in the tissues of the lungs. It\'s the leading cause of cancer deaths worldwide. Early detection through screening is important. Main types include small cell lung cancer (SCLC) and non-small cell lung cancer (NSCLC). Adenocarcinoma is the most common type of lung cancer.',
  'non-small cell lung cancer': 'Non-small cell lung cancer (NSCLC) accounts for about 85% of lung cancers. Subtypes include adenocarcinoma (develops in mucus-secreting cells), squamous cell carcinoma (develops in thin, flat cells), and large cell carcinoma (grows and spreads rapidly). NSCLC generally grows more slowly than small cell lung cancer.',
  'small cell lung cancer': 'Small cell lung cancer (SCLC) accounts for about 15% of lung cancers. It grows and spreads faster than NSCLC. It often starts in the large airways of the lungs. SCLC is strongly associated with smoking and is more common in the central part of the lung.',
  'adenocarcinoma': 'Adenocarcinoma is the most common type of lung cancer, accounting for about 40% of cases. It develops in mucus-secreting glands of the lungs. It often occurs in the outer regions of the lungs and grows slowly. It\'s the most common type in non-smokers and younger people.',
  'symptoms': 'Common lung cancer symptoms include: persistent cough lasting more than 3 weeks, chest pain, shortness of breath, coughing up blood, hoarseness, recurring pneumonia, and fatigue. You may also experience weight loss, appetite loss, and weakness. If symptoms persist beyond 2-3 weeks, consult a healthcare provider.',
  'cough blood': 'Coughing up blood (hemoptysis) is a serious symptom that requires immediate medical attention. It can indicate lung cancer, tuberculosis, pneumonia, or other lung conditions. This is NOT normal and should be evaluated by a doctor immediately.',
  'chest pain': 'Chest pain associated with lung cancer usually occurs when cancer has spread to the lining of the lungs (pleura) or chest wall. The pain may worsen when breathing deeply, coughing, or laughing. Chest pain can also stem from other conditions, so medical evaluation is important.',
  'shortness of breath': 'Shortness of breath (dyspnea) in lung cancer occurs when tumors block airways or fluid accumulates around the lungs. It can also result from anemia or weakening of respiratory muscles. Persistent shortness of breath should be evaluated by a healthcare provider.',
  'hoarseness': 'Hoarseness lasting more than 2-3 weeks can indicate lung cancer if the tumor affects the vocal cords or related nerves. Other causes include laryngitis, allergies, or acid reflux. Persistent hoarseness warrants medical evaluation to determine the cause.',
  'treatment': 'Lung cancer treatment options include: surgery (removing tumors), chemotherapy (using drugs to kill cancer cells), radiation therapy (high-energy beams), targeted therapy (drugs targeting specific mutations like EGFR), and immunotherapy (helping immune system fight cancer). Treatment depends on cancer stage, type, and patient health.',
  'surgery': 'Surgical options for lung cancer include: lobectomy (removing a lobe), segmentectomy (removing part of a lobe), pneumonectomy (removing entire lung), and wedge resection (removing small portion). Surgery is often used for early-stage lung cancer when the tumor is localized.',
  'chemotherapy': 'Chemotherapy uses powerful drugs to kill cancer cells throughout the body. Common lung cancer chemotherapy drugs include cisplatin, carboplatin, pemetrexed, and gemcitabine. Side effects may include nausea, hair loss, fatigue, and infection risk. Treatment is usually given in cycles over several weeks or months.',
  'radiation therapy': 'Radiation therapy uses high-energy beams to kill cancer cells. External beam radiation delivers beams from outside the body, while brachytherapy places radioactive material near the tumor. For lung cancer, stereotactic body radiation therapy (SBRT) can target tumors precisely with fewer treatments.',
  'targeted therapy': 'Targeted therapy drugs attack specific genetic mutations in cancer cells. For lung cancer, targets include EGFR mutations, ALK rearrangements, ROS1 mutations, BRAF mutations, and NTRK fusions. These therapies often have fewer side effects than traditional chemotherapy but may develop resistance over time.',
  'immunotherapy': 'Immunotherapy boosts the immune system to fight cancer cells. Checkpoint inhibitors (like pembrolizumab, nivolumab, atezolizumab) block proteins that protect cancer cells. CAR-T cell therapy enhances immune cells. Immunotherapy has shown significant benefits for advanced lung cancer with high PD-L1 expression.',
  'stage': 'Lung cancer stages (0-4) describe cancer spread: Stage 0 = abnormal cells not yet cancer; Stage 1 = cancer confined to lungs (1A: ≤3cm, 1B: 3-4cm); Stage 2 = cancer in lungs + nearby lymph nodes (2A: tumors 4-5cm, 2B: larger); Stage 3 = cancer in chest structures; Stage 4 = spread to other organs (brain, bones, liver). Earlier stages have better survival rates.',
  'stage 1': 'Stage 1 lung cancer is confined to the lungs with no spread to lymph nodes or distant organs. Stage 1A has tumors ≤3cm, Stage 1B has tumors 3-4cm. 5-year survival rate for Stage 1 is approximately 50-60%. Surgery is the primary treatment, sometimes followed by adjuvant therapy.',
  'stage 2': 'Stage 2 lung cancer involves tumors larger than 4-5cm or cancer in nearby lymph nodes. Stage 2A has smaller tumors with lymph node involvement, Stage 2B has larger tumors or more lymph nodes involved. 5-year survival rate is approximately 30-40%. Surgery is usually primary treatment, often with chemotherapy.',
  'stage 3': 'Stage 3 lung cancer involves cancer in lymph nodes within the chest or invasion into neighboring structures. Stage 3A is potentially resectable, Stage 3B is often unresectable. 5-year survival rate is approximately 10-20%. Treatment typically combines surgery, chemotherapy, and/or radiation therapy (concurrent chemoradiation).',
  'stage 4': 'Stage 4 lung cancer has spread (metastasized) to other organs like brain, bones, liver, or adrenal glands. It may also involve fluid around lungs or heart. 5-year survival rate is approximately 5%. Treatment focuses on quality of life and may include chemotherapy, targeted therapy, or immunotherapy.',
  'prevention': 'Ways to reduce lung cancer risk: Don\'t smoke or quit smoking (most important), avoid secondhand smoke exposure, test your home for radon (seal cracks), avoid asbestos and air pollution, eat healthy diet rich in vegetables and fruits, exercise regularly, maintain healthy weight, limit alcohol. Smoking is responsible for 80-90% of lung cancer deaths.',
  'smoking': 'Smoking is the primary risk factor for lung cancer. Smokers are 15-30 times more likely to develop lung cancer than non-smokers. Risk increases with duration and intensity of smoking. Even after quitting, ex-smokers have elevated risk for 10+ years. Secondhand smoke also significantly increases non-smoker risk.',
  'radon': 'Radon is a colorless, odorless radioactive gas that seeps from soil into homes. Prolonged radon exposure is the second leading cause of lung cancer after smoking. Test your home for radon (EPA recommends testing if levels are 4 pCi/L or higher). Radon can be mitigated through ventilation and sealing.',
  'asbestos': 'Asbestos is a mineral fiber that causes lung cancer and mesothelioma when inhaled. Occupational exposure (construction, military, shipyard workers) is the primary risk. Symptoms may appear 20-50 years after exposure. Wearing protective equipment and following safety protocols can prevent exposure.',
  'prognosis': 'Lung cancer prognosis depends on cancer type, stage at diagnosis, patient age/health, and genetics. 5-year survival rates: Stage 1 ~50-60%, Stage 2 ~30-40%, Stage 3 ~10-20%, Stage 4 ~5%. Overall 5-year survival is ~20%. Early detection significantly improves outcomes. Tumor genetics (EGFR, ALK status) also affect prognosis.',
  'survival rate': 'Lung cancer 5-year survival rates (percentage living 5+ years after diagnosis): Overall ~20%, Stage 1 ~50-60%, Stage 2 ~30-40%, Stage 3 ~10-20%, Stage 4 ~5%. Survival varies by age, performance status, histology, and molecular markers. Never-smokers have slightly better outcomes. Advanced age can reduce survival.',
  'screening': 'Lung cancer screening (low-dose CT scans) is recommended for: age 50-80 with 20+ pack-year smoking history, or age 55-80 with 10+ pack-year history plus one risk factor (COPD, family history, radon). Annual screening can detect cancer earlier when treatment is most effective. Discuss screening benefits/risks with your doctor.',
  'ct scan': 'CT (computed tomography) scan uses X-rays to create detailed cross-sectional images of the lungs. Low-dose CT (LDCT) uses lower radiation for lung cancer screening. CT can detect nodules as small as 2-3mm. Nodules may be benign (non-cancerous) or malignant and require follow-up imaging or biopsy.',
  'biopsy': 'A lung biopsy removes tissue sample for cancer diagnosis. Methods include: bronchoscopy (camera through airway), transthoracic needle biopsy (needle through skin), CT-guided biopsy, or surgical biopsy. Pathology analysis confirms cancer type and can identify genetic mutations to guide treatment selection.',
  'pet scan': 'PET (positron emission tomography) scan uses radioactive tracer to detect areas of high metabolic activity where cancer cells grow. Combined with CT (PET-CT) provides detailed images. PET is useful for detecting metastases (spread) and assessing treatment response. It helps stage cancer and plan treatment.',
  'mri': 'MRI (magnetic resonance imaging) uses magnetic fields to create detailed images without radiation. For lung cancer, MRI is often used to detect brain metastases and assess chest wall invasion. It provides excellent soft tissue contrast and is useful when CT is contraindicated or for specific questions.',
  'oncology': 'Oncology is the medical specialty dealing with cancer diagnosis, treatment, and management. Oncologists are doctors specializing in cancer and may be medical oncologists (drugs), radiation oncologists (radiation), or surgical oncologists (surgery). They work with multidisciplinary teams to provide comprehensive care.',
  'oncologist': 'An oncologist is a physician specializing in cancer treatment. Medical oncologists prescribe chemotherapy and targeted therapies. Radiation oncologists deliver radiation therapy. Surgical oncologists perform cancer surgery. Pulmonologists specialize in lung diseases. Your oncology team works together to create personalized treatment plans.',
  'chemotherapy side effects': 'Chemotherapy side effects may include: nausea/vomiting, hair loss, fatigue, low blood cell counts (infection, bleeding, anemia), mouth sores, diarrhea/constipation, nerve damage, heart damage. Most side effects are temporary and manageable. Supportive medications and lifestyle adjustments can help minimize symptoms.',
  'nausea': 'Chemotherapy-induced nausea and vomiting (CINV) is common but manageable. Anti-nausea medications (5-HT3 antagonists, NK1 antagonists) are often given before chemotherapy. Ginger, acupressure, relaxation, and small frequent meals may help. Severe nausea should be reported to your oncology team immediately.',
  'fatigue': 'Cancer-related fatigue is extreme tiredness not relieved by rest. It\'s common during chemotherapy and radiation. Strategies include: gentle exercise, adequate sleep, nutrition, stress management, and potentially stimulant medications. Fatigue may persist months after treatment ends (cancer survivorship fatigue).',
  'hair loss': 'Hair loss (alopecia) occurs with some chemotherapy drugs but not others. Hair typically falls out 2-3 weeks into treatment and regrows 3-6 months after treatment ends. Preventive methods include scalp cooling caps (reduce blood flow to scalp). Wigs, scarves, hats, and counseling can help with emotional impact.',
  'clinical trial': 'Clinical trials test new lung cancer treatments. They compare new therapies to standard treatments or placebo. Trials may test new drugs, drug combinations, immunotherapy, or novel approaches. Participation can provide access to cutting-edge treatments and help advance cancer research. Ask your oncologist about available trials.',
  'targeted mutation': 'Lung cancer genetic testing identifies mutations that guide targeted therapy selection. Common mutations: EGFR (40% of adenocarcinomas, target: erlotinib, gefitinib), ALK (5%, target: crizotinib, alectinib), ROS1 (1%, target: crizotinib), BRAF (2%, target: dabrafenib+trametinib). Testing informs personalized treatment decisions.',
  'pdl1': 'PD-L1 is a protein on cancer cells that blocks immune response. PD-L1 expression level predicts immunotherapy response. High PD-L1 (≥50%) benefits most from checkpoint inhibitors. Low PD-L1 (<1%) may need combination therapy. PD-L1 testing helps select appropriate immunotherapy regimen.',
  'cancer support': 'Cancer support resources include: support groups (peer and professional), counseling/therapy, cancer organizations (American Cancer Society), financial assistance programs, transportation services, and nutritional guidance. Mental health support is crucial. Many hospitals have psycho-oncology services. Don\'t hesitate to seek help.',
  'clinical symptoms': 'Watch for clinical symptoms requiring immediate medical attention: severe chest pain, sudden severe shortness of breath, coughing up large amounts of blood, confusion or mental changes, severe headache or vision changes (possible brain metastases), severe back pain (possible spine metastases), severe abdominal pain.',
  'cancer research': 'Cancer research is advancing rapidly. Areas include: immunotherapy combinations, targeted therapy for new mutations, liquid biopsies (blood tests for cancer detection), CAR-T cell therapy, nano-particle drug delivery, and personalized medicine. Clinical trials make these advances available to patients. Research gives hope for improved outcomes.',
  'cancer': 'Cancer is a disease where abnormal cells grow uncontrollably. It can originate in any body part and spread to other areas (metastasis). Over 200 types exist. Risk factors include: age, smoking, family history, environmental exposures, and genetics. Early detection and treatment significantly improve survival rates. Prevention through lifestyle is important.',
  'metastasis': 'Metastasis is cancer spread from the original (primary) site to other organs. Common lung cancer metastases: brain (30-40% of patients), bones (30%), liver (40%), adrenal glands. Metastatic disease is stage 4 (incurable but treatable). Metastases may grow slowly or rapidly depending on cancer type and genetics.',
  'brain metastases': 'Brain metastases occur in 30-40% of advanced lung cancer patients. Symptoms: headaches, weakness, vision changes, dizziness, cognitive changes. Treatment includes: stereotactic radiosurgery (focused radiation), whole brain radiation, surgery, or targeted therapy. Brain metastases significantly impact prognosis and quality of life.',
  'bone metastases': 'Bone metastases occur in about 30% of advanced lung cancer patients. Symptoms: bone pain, fractures, spinal cord compression. High-risk sites: spine, pelvis, ribs, femur. Treatment includes: radiation therapy, bisphosphonates (strengthen bones), pain management, surgery for unstable fractures. Bone metastases affect mobility and quality of life.',
  'liver metastases': 'Liver metastases occur in about 40% of advanced lung cancer patients. Often asymptomatic initially. Symptoms: abdominal pain, weight loss, jaundice (yellowing skin). Detected by imaging (CT, ultrasound). Treatment: chemotherapy, targeted therapy, immunotherapy, or liver-directed therapies (radiation, ablation). Liver involvement affects overall prognosis.',
  'family history': 'Family history of cancer increases personal risk. First-degree relatives (parent, sibling, child) with cancer increase risk more than distant relatives. Multiple family members with cancer or early-onset cancer suggests genetic predisposition. Genetic counseling and testing (BRCA1/2, Lynch syndrome) may be recommended.',
  'genetic counselor': 'Genetic counselors are healthcare professionals who assess cancer risk based on family history and personal factors. They explain genetic testing, interpret results, and discuss implications. They help patients understand inherited cancer syndromes and make informed decisions about screening or prevention strategies.',
  'wellness': 'Cancer wellness strategies include: nutrition (balanced diet, hydration), exercise (as tolerated), stress management (meditation, yoga), sleep (7-9 hours), social support, mental health care, and cancer survivor programs. Wellness improves quality of life and may enhance treatment outcomes. Discuss plans with your healthcare team.',
  'nutrition': 'Cancer nutrition is important for maintaining strength and supporting treatment. Emphasize: protein (rebuilds tissue), whole grains, vegetables, fruits, healthy fats. Manage side effects: small frequent meals for nausea, soft foods for mouth sores. Avoid: processed foods, excessive sugar, alcohol. Work with oncology nutritionist for personalized plans.',
  'exercise': 'Exercise during cancer treatment (if approved by doctor) can: improve strength and endurance, reduce fatigue, improve mental health, support cardiovascular health. Start gently with walking, gentle yoga. Avoid strenuous exercise during active treatment. Physical therapy can help. Discuss exercise plans with your oncology team.',
};

const getCancerResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Check for keywords in knowledge base
  for (const [keyword, response] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  // Default response if no keywords match
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return 'I\'m a Cancer Information Assistant. I can help answer questions about: lung cancer types, symptoms, treatment options (surgery, chemotherapy, radiation, targeted therapy, immunotherapy), cancer stages, prevention, screening, diagnosis methods, prognosis, genetic testing, clinical trials, side effect management, metastases, and survivorship. What would you like to know?';
  }
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return 'Hello! I\'m your Cancer Information Assistant, specialized in lung cancer and oncology. I can provide detailed information about cancer types, symptoms, treatments, screening, prevention, and more. How can I help you today?';
  }
  
  return 'I appreciate your question. I specialize in cancer information including lung cancer, symptoms, treatment options, prevention, screening, clinical trials, and survivorship. Please ask me something like "What is lung cancer?", "What are the symptoms?", or "What treatment options exist?". For medical advice, consult with a healthcare professional.';
};

export const getAIResponse = async (req: Request, res: Response) => {
  console.log('--- AI Chat Request Received ---');
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('User message:', message);
    
    const responseText = getCancerResponse(message);
    
    console.log('Response generated successfully');
    res.json({ response: responseText });
  } catch (error: any) {
    console.error('AI Chat Error Details:', error);
    res.status(500).json({ 
      error: `Error: ${error.message || 'Unknown error'}`,
    });
  }
};
