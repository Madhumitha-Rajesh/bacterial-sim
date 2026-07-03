const flashcards = [
  {
    question: 'What is E. coli?',
    answer:
      'Escherichia coli is a rod-shaped, Gram-negative bacterium that normally lives in the gut of humans and animals. Most strains are harmless and grow very fast (it can double roughly every 20 minutes under ideal conditions), which is why it is the classic lab organism for studying bacterial growth.',
  },
  {
    question: 'What is Pseudomonas aeruginosa?',
    answer:
      'Pseudomonas aeruginosa is a Gram-negative bacterium found widely in soil and water. It is known for being an opportunistic pathogen and for its natural resistance to many antibiotics (including ampicillin), which makes it a useful example for studying intrinsic antibiotic resistance.',
  },
  {
    question: 'What is Bacillus subtilis?',
    answer:
      'Bacillus subtilis is a Gram-positive, rod-shaped bacterium commonly found in soil. It grows more slowly than E. coli and can form tough, dormant endospores when conditions become unfavourable, helping it survive heat, drought, or nutrient shortage.',
  },
  {
    question: 'How does temperature affect bacterial growth?',
    answer:
      'Every species has an optimal temperature where its enzymes work best and growth is fastest. Above or below that range, growth slows because enzyme activity drops off; too far outside the tolerable range and growth stops almost completely. That is why the simulation growth rate falls sharply as you move the temperature slider away from each species\u2019 optimum.',
  },
  {
    question: 'How do antibiotics affect bacterial growth?',
    answer:
      'Once the antibiotic concentration on the plate rises above a species\u2019 MIC (minimum inhibitory concentration), it starts killing or strongly suppressing the sensitive population. A tiny fraction of the starting population is naturally drug-tolerant (resistant); because it is barely affected, it keeps growing and can eventually take over the plate \u2014 which is exactly the green-to-purple shift you see in the petri dish animation.',
  },
]

export default flashcards
