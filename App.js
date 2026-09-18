import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Audio } from 'expo-av';

// Nossa "Base de Dados" de músicas (pode ser URL ou arquivo local com require)
const PLAYLIST = [
  {
    id: '1',
    title: 'Música 1 - Aquela que marcou minha adolescência',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Música 2 - Essa é pedrada ',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: 'Música 3 - Desconfie de quem não gosta',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  }
];

export default function PlaylistScreen() {
  // Estados do Motor de Áudio Central
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null); // Guarda o ID da música atual
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Estados de Tempo
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Formatador de tempo (00:00)
  const formatTime = (millis) => {
    if (!millis) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Lógica principal: Tocar, Pausar ou Trocar de Música
  async function handlePlaySong(item) {
    // CENÁRIO 1: O aluno clicou na MESMA música que já está ativa
    if (playingId === item.id) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return; // Para a execução da função aqui
    }

    // CENÁRIO 2: O aluno clicou em uma música NOVA
    // Primeiro, descarregamos a música anterior (se existir alguma tocando)
    if (sound) {
      await sound.unloadAsync();
      setPosition(0);
      setDuration(0);
    }

    try {
      console.log(`Carregando: ${item.title}`);
      
      // Carrega a nova música (Atenção: se fosse arquivo local, usaria uri: require('./assets/musica.mp3'))
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.url },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingId(item.id);
      setIsPlaying(true);

      // O "Espião" de status conectado à nova música
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao carregar música:', error);
    }
  }

  // Limpeza de memória ao fechar o app
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  // Função que desenha cada item da lista
  const renderSong = ({ item }) => {
    // Verifica se este item específico é a música que está tocando agora
    const isActive = playingId === item.id;
    // Calcula o progresso apenas se esta for a música ativa
    const progressPercentage = isActive && duration > 0 ? (position / duration) * 100 : 0;

    return (
      <View style={[styles.songCard, isActive && styles.activeCard]}>
        
        {/* Linha Superior: Nome da Música + Botão de Play */}
        <View style={styles.songHeader}>
          <Text style={[styles.songTitle, isActive && styles.activeText]}>
            {item.title}
          </Text>
          
          <TouchableOpacity 
            style={[styles.playButton, isActive && isPlaying ? styles.pauseButton : null]} 
            onPress={() => handlePlaySong(item)}
          >
            <Text style={styles.playButtonText}>
              {isActive && isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Linha Inferior: Barra de Progresso (SÓ APARECE SE A MÚSICA FOR A ATIVA) */}
        {isActive && (
          <View style={styles.playerUI}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Minha Playlist 🎸🎶🎤🎙️</Text>
      
      <FlatList
        data={PLAYLIST}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3f74a8',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f5f6fb',
    marginBottom: 20,
  },
  songCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF', // Fundo azul bem clarinho para destacar
  },
  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1, // Faz o texto ocupar o espaço e empurrar o botão para o canto
  },
  activeText: {
    color: '#1D4ED8',
  },
  playButton: {
    backgroundColor: '#3bf63b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  pauseButton: {
    backgroundColor: '#EF4444',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Estilos da Barra de Progresso
  playerUI: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: '#DBEAFE',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  }
});