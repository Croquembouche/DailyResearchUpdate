export const TOPICS = [
  {
    id: 'algorithms',
    label: 'Autonomous Driving Algorithms',
    query: '(all:"autonomous driving" OR all:"autonomous vehicle" OR all:"self-driving") AND (all:planning OR all:perception OR all:control OR all:prediction OR all:"end-to-end")'
  },
  {
    id: 'simulation',
    label: 'Simulation',
    query: '(all:"autonomous driving" OR all:"autonomous vehicle") AND (all:simulation OR all:simulator OR all:"synthetic data" OR all:"digital twin")'
  },
  {
    id: '3d-reconstruction',
    label: '3D Reconstruction',
    query: '(all:"autonomous driving" OR all:"autonomous vehicle" OR all:driving) AND (all:"3D reconstruction" OR all:NeRF OR all:"Gaussian splatting" OR all:SLAM OR all:"occupancy")'
  },
  {
    id: 'safety',
    label: 'Safety',
    query: '(all:"autonomous driving" OR all:"autonomous vehicle") AND (all:safety OR all:robustness OR all:verification OR all:validation OR all:"risk assessment")'
  },
  {
    id: 'transportation',
    label: 'Autonomous Vehicle Transportation',
    query: '(all:"autonomous vehicle" OR all:"autonomous vehicles" OR all:"automated vehicles") AND (all:transportation OR all:traffic OR all:mobility OR all:fleet OR all:routing)'
  },
  {
    id: 'storage-edr',
    label: 'Storage & EDR',
    query: '(all:"autonomous vehicle" OR all:"autonomous vehicles" OR all:"automated driving" OR all:"self-driving") AND (all:"event data recorder" OR all:"vehicle black box" OR all:"data recorder" OR all:"data logging" OR all:"incident data" OR all:"crash data" OR all:storage)'
  }
];

export function getTopic(id) {
  return TOPICS.find((topic) => topic.id === id);
}
