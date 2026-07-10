import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Home: React.FC = () => (
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Snippets</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">
      <h2>Snippets</h2>
      <p>Snippets — Mobile app (ionic)</p>
    </IonContent>
  </IonPage>
);
export default Home;
