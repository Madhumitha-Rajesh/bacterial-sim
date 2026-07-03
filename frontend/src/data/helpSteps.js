const helpSteps = [
  {
    title: 'Choose your bacteria species',
    detail:
      'Pick E. coli, Pseudomonas aeruginosa, or Bacillus subtilis from the Species dropdown. Each one has different growth speed, temperature preference, and antibiotic sensitivity.',
  },
  {
    title: 'Set the temperature',
    detail:
      'Drag the Temperature slider. Growth is fastest near each species\u2019 optimal temperature and slows down (or stops) the further you move away from it.',
  },
  {
    title: 'Set the nutrient level',
    detail:
      'Choose Low, Medium, or High. Higher nutrient levels raise the maximum population the plate can support (its carrying capacity) and speed up growth.',
  },
  {
    title: 'Choose an antibiotic and its concentration',
    detail:
      'Select Ampicillin, Ciprofloxacin, or Streptomycin, then set the Antibiotic (%) slider. Leave it at 0% to see unrestricted growth, or raise it to see the antibiotic suppress or kill the sensitive population.',
  },
  {
    title: 'Set the experiment duration',
    detail:
      'Enter how many hours the experiment should run for (1\u2013168 hours). Longer durations give resistant colonies more time to take over the plate.',
  },
  {
    title: 'Click "Start Experiment"',
    detail:
      'The parameters are sent to the simulation engine, which calculates the growth curve. Watch the petri dish animate live \u2014 green colonies are normal/sensitive bacteria, purple colonies are resistant mutants.',
  },
  {
    title: 'Read the live stats',
    detail:
      'While the animation plays, Population, Growth Rate, Time, and Status update in real time on the right-hand cards.',
  },
  {
    title: 'Open the Simulation Dynamics Dashboard',
    detail:
      'Once the run finishes (or while it\u2019s in progress), click "View Simulation Dynamics Dashboard" to see growth-phase status, survival rate, colony sizes, peak density, doubling time, and full growth/clearance graphs.',
  },
  {
    title: 'Compare with past experiments',
    detail:
      'Every experiment you run is saved automatically. Open History to revisit past runs and compare two or more of them side by side.',
  },
]

export default helpSteps
